import { Card, Tag, Checkbox, Typography, Button, Space, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Todo } from '@/types/todo';
import { priorityColors } from './TodoForm';

const { Text } = Typography;

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: 'none',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  transition: 'box-shadow 0.2s, transform 0.15s',
};

export default function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  const isOverdue = !todo.completed && todo.dueDate && dayjs(todo.dueDate).isBefore(dayjs(), 'day');

  return (
    <Card
      size="small"
      style={{
        ...cardStyle,
        opacity: todo.completed ? 0.55 : 1,
        borderLeft: `3px solid ${priorityColors[todo.priority]}`,
      }}
      styles={{ body: { padding: '14px 18px' } }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Checkbox
          checked={todo.completed}
          onChange={(e) => onToggle(todo.id, e.target.checked)}
          style={{ marginTop: 4 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text
              delete={todo.completed}
              style={{ fontSize: 15, fontWeight: 500, color: '#1e293b' }}
            >
              {todo.title}
            </Text>
            <Tag
              color={priorityColors[todo.priority]}
              style={{ fontSize: 11, borderRadius: 4, lineHeight: '18px' }}
            >
              P{todo.priority}
            </Tag>
          </div>
          {todo.description && (
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
              {todo.description}
            </Text>
          )}
          {todo.content && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2, color: '#94a3b8' }}>
              {todo.content.length > 100 ? todo.content.slice(0, 100) + '...' : todo.content}
            </Text>
          )}
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {todo.dueDate && (
              <Tooltip title={isOverdue ? '已逾期' : ''}>
                <Text
                  type={isOverdue ? 'danger' : 'secondary'}
                  style={{ fontSize: 12 }}
                >
                  <CalendarOutlined /> {dayjs(todo.dueDate).format('MM-DD')}
                </Text>
              </Tooltip>
            )}
            {todo.tags.map((tag) => (
              <Tag key={tag} style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>{tag}</Tag>
            ))}
          </div>
        </div>
        <Space size={4} style={{ flexShrink: 0 }}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(todo)}
            style={{ color: '#94a3b8' }}
          />
          <Popconfirm
            title="确认删除？"
            onConfirm={() => onDelete(todo.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      </div>
    </Card>
  );
}
