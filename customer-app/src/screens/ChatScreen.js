import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import api from '../config/api';
import { db } from '../config/firebase';

export default function ChatScreen() {
  const [loading, setLoading] = useState(true);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const flatListRef = useRef(null);

  const userIdPromise = useMemo(() => AsyncStorage.getItem('userData'), []);

  useEffect(() => {
    let unsub = null;

    const init = async () => {
      try {
        const res = await api.get('/chats/customer/thread');
        const thread = res?.data?.data?.thread;
        if (thread?._id) {
          setThreadId(thread._id);
        }
      } catch (e) {
        console.log('Customer chat thread fetch error:', e?.response?.data || e?.message || e);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    if (!threadId) return undefined;

    const q = query(
      collection(db, 'chats', threadId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const next = [];
      snap.forEach((doc) => {
        next.push({ id: doc.id, ...doc.data() });
      });
      setMessages(next);
      requestAnimationFrame(() => {
        if (flatListRef.current && next.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      });
    });

    return () => unsub();
  }, [threadId]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setText('');

    try {
      const res = await api.post('/chats/customer/send', {
        message: trimmed,
        type: 'message',
      });

      const newThread = res?.data?.data?.thread;
      if (!threadId && newThread?._id) {
        setThreadId(newThread._id);
      }
    } catch (e) {
      console.log('Customer send message error:', e?.response?.data || e?.message || e);
      setText(trimmed);
    }
  };

  const renderItem = ({ item }) => {
    const isMine = item.senderRole === 'customer';

    return (
      <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextOther]}>
            {item.message}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1453b4" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerLogoContainer}>
          <Image
            source={require('../../assets/logo.jpg')}
            style={styles.logoImage}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Chat Support</Text>
            <Text style={styles.headerSubtitle}>Message admin for help</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type your message..."
          style={styles.input}
          placeholderTextColor="#94a3b8"
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} activeOpacity={0.9}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF' },
  header: { 
    paddingTop: 54, 
    paddingHorizontal: 20, 
    paddingBottom: 16, 
    backgroundColor: '#1453b4',
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { marginTop: 6, fontSize: 14, color: '#DBEAFE', fontWeight: '500' },
  listContent: { padding: 16, paddingBottom: 12 },
  bubbleRow: { marginBottom: 12, flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: { 
    maxWidth: '80%', 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleMine: { 
    backgroundColor: '#1453b4', 
    borderTopRightRadius: 4,
    shadowColor: '#1453b4',
    shadowOpacity: 0.3,
  },
  bubbleOther: { 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
  },
  bubbleText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  bubbleTextMine: { color: '#FFFFFF' },
  bubbleTextOther: { color: '#1F2937' },
  composer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  input: { 
    flex: 1, 
    minHeight: 44, 
    maxHeight: 120, 
    backgroundColor: '#EFF6FF', 
    borderRadius: 22, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    fontSize: 15, 
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  sendButton: { 
    marginLeft: 12, 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#1453b4', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#1453b4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
