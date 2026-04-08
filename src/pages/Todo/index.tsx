import { useState, useEffect } from 'react';
import { Button, Segmented, Modal, Empty, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTodoStore } from '@/stores/todoStore';
import type { Todo } from '@/types/todo';
import TodoList from './TodoList';
import TodoForm from './TodoForm';

const { Title } = Typography;

type FilterType = 'all' | 'active' | 'completed';

export default function TodoPage() {
  const { todos, loading, loadTodos, addTodo, updateTodo, deleteTodo } = useTodoStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const handleSave = async (values: Omit<Todo, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    if (editingTodo) {
      await updateTodo(editingTodo.id, values);
    } else {
      await addTodo({ ...values, completed: false });
    }
    setModalOpen(false);
    setEditingTodo(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>待办事项</Title>
        <Space size={12}>
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as FilterType)}
            options={[
              { label: '全部', value: 'all' },
              { label: '进行中', value: 'active' },
              { label: '已完成', value: 'completed' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingTodo(null); setModalOpen(true); }}>
            新建
          </Button>
        </Space>
      </div>

      <TodoList
        todos={filteredTodos}
        loading={loading}
        onToggle={(id, completed) => updateTodo(id, { completed })}
        onEdit={(todo) => { setEditingTodo(todo); setModalOpen(true); }}
        onDelete={deleteTodo}
      />

      {!loading && filteredTodos.length === 0 && (
        <Empty description={filter === 'all' ? '暂无待办事项，点击新建开始' : `没有${filter === 'active' ? '进行中' : '已完成'}的事项`} />
      )}

      <Modal
        title={editingTodo ? '编辑待办' : '新建待办'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingTodo(null); }}
        footer={null}
        destroyOnClose
      >
        <TodoForm
          initialValues={editingTodo ? {
            title: editingTodo.title,
            description: editingTodo.description,
            content: editingTodo.content,
            priority: editingTodo.priority,
            dueDate: editingTodo.dueDate,
            tags: editingTodo.tags,
          } : undefined}
          onSubmit={handleSave}
          onCancel={() => { setModalOpen(false); setEditingTodo(null); }}
        />
      </Modal>
    </div>
  );
}
