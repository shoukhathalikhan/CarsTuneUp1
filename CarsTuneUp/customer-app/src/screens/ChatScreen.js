import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
        <Text style={styles.headerTitle}>Chat Support</Text>
        <Text style={styles.headerSubtitle}>Message admin for help</Text>
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  headerSubtitle: { marginTop: 4, fontSize: 13, color: '#64748b' },
  listContent: { padding: 16, paddingBottom: 12 },
  bubbleRow: { marginBottom: 10, flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14 },
  bubbleMine: { backgroundColor: '#1453b4', borderTopRightRadius: 4 },
  bubbleOther: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderTopLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  bubbleTextOther: { color: '#0f172a' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
  input: { flex: 1, minHeight: 42, maxHeight: 120, backgroundColor: '#f1f5f9', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  sendButton: { marginLeft: 10, width: 42, height: 42, borderRadius: 14, backgroundColor: '#1453b4', alignItems: 'center', justifyContent: 'center' },
});
