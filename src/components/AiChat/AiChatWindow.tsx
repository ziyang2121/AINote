import { useState, useEffect, useRef } from 'react';
import { FloatButton, Drawer, Input, Button, Spin, Empty } from 'antd';
import { RobotOutlined, ClearOutlined } from '@ant-design/icons';
import { useChatStore } from '@/stores/chatStore';
import { useSettingsStore } from '@/stores/settingsStore';
import ChatMessageBubble from './ChatMessageBubble';

export default function AiChatWindow() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { messages, loading, loadMessages, send, clearMessages } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { apiKey } = useSettingsStore();

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || loading) return;
    setInputValue('');
    send(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <FloatButton
        icon={<RobotOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24 }}
        onClick={() => setOpen(true)}
        tooltip="AI 助手"
      />
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RobotOutlined style={{ color: '#0d9488' }} /> AI 助手
            </span>
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              onClick={clearMessages}
              style={{ color: '#94a3b8' }}
            >
              清空
            </Button>
          </div>
        }
        placement="right"
        width={420}
        onClose={() => setOpen(false)}
        open={open}
        styles={{
          body: {
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            height: '100%',
          },
        }}
      >
        {!apiKey && (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            请先在设置中配置 API Key
          </div>
        )}

        {/* 消息列表 */}
        <div style={{ flex: 1, padding: '0 16px', overflowY: 'auto' }}>
          {messages.length === 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: '#94a3b8' }}>开始对话吧</span>}
              style={{ marginTop: 80 }}
            />
          )}
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          {loading && (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <Spin size="small" /> <span style={{ marginLeft: 8, color: '#94a3b8' }}>思考中...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        {apiKey && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9' }}>
            <Input.TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (Enter 发送)"
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={loading}
              style={{ borderRadius: 10 }}
            />
          </div>
        )}
      </Drawer>
    </>
  );
}
