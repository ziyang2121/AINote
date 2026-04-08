import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { ChatMessage } from '@/types/ai';
import ActionPreview from './ActionPreview';
import { useChatStore } from '@/stores/chatStore';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const { confirmAction, cancelAction, confirmAllActions } = useChatStore();
  const isUser = message.role === 'user';
  const pendingCount = message.actions.filter((a) => a.status === 'pending').length;

  return (
    <div style={{ display: 'flex', gap: 10, margin: '14px 0', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      {!isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
        }}>
          <RobotOutlined style={{ color: '#fff', fontSize: 16 }} />
        </div>
      )}
      <div style={{ maxWidth: '78%' }}>
        <div
          style={{
            padding: '10px 16px',
            borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: isUser
              ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'
              : '#f8fafc',
            color: isUser ? '#fff' : '#1e293b',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: 14,
            boxShadow: isUser ? '0 2px 8px rgba(13, 148, 136, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          {message.content}
        </div>
        {message.actions.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {pendingCount > 1 && (
              <Button
                size="small"
                type="primary"
                block
                style={{ marginBottom: 8, borderRadius: 8 }}
                onClick={() => confirmAllActions(message.id)}
              >
                全部执行 ({pendingCount})
              </Button>
            )}
            {message.actions.map((action, index) => (
              <ActionPreview
                key={`${message.id}-${index}`}
                action={action}
                onConfirm={() => confirmAction(message.id, index)}
                onCancel={() => cancelAction(message.id, index)}
              />
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(14, 165, 233, 0.25)',
        }}>
          <UserOutlined style={{ color: '#fff', fontSize: 14 }} />
        </div>
      )}
    </div>
  );
}
