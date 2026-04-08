import { useState, useEffect } from 'react';
import { Button, Input, Empty, Card, Space, Typography, Modal, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNoteStore } from '@/stores/noteStore';
import { useTodoStore } from '@/stores/todoStore';
import type { Note } from '@/types/note';
import NoteForm from './NoteForm';

const { Title, Text } = Typography;
const { Search } = Input;

const cardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: 'none',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  transition: 'box-shadow 0.2s, transform 0.15s',
};

export default function NotesPage() {
  const { notes, loading, loadNotes, addNote, deleteNote } = useNoteStore();
  const { addTodo } = useTodoStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailNote, setDetailNote] = useState<Note | null>(null);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const filteredNotes = notes.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const handleAdd = async (values: { title: string; content: string; tags: string[] }) => {
    await addNote(values);
    setModalOpen(false);
  };

  const handleConvertToTodo = (note: Note) => {
    addTodo({
      title: note.title,
      description: note.content.slice(0, 200),
      content: '',
      priority: 3,
      dueDate: null,
      completed: false,
      tags: [...note.tags, '来自笔记'],
    });
  };

  if (detailNote) {
    return (
      <div>
        <Space style={{ marginBottom: 20 }}>
          <Button icon={<ArrowRightOutlined rotate={180} />} onClick={() => setDetailNote(null)} type="text">
            返回
          </Button>
          <Title level={3} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>
            {detailNote.title}
          </Title>
        </Space>
        <Card
          size="small"
          bordered={false}
          style={{ ...cardStyle, marginBottom: 20 }}
          styles={{ body: { padding: '20px 24px' } }}
        >
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {detailNote.tags.map((tag) => (
              <Tag key={tag} style={{ borderRadius: 4 }}>{tag}</Tag>
            ))}
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto', color: '#94a3b8' }}>
              更新于 {new Date(detailNote.updatedAt).toLocaleString('zh-CN')}
            </Text>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, minHeight: 100, color: '#334155', fontSize: 14 }}>
            {detailNote.content}
          </div>
        </Card>
        <Button type="primary" onClick={() => handleConvertToTodo(detailNote)} style={{ borderRadius: 8 }}>
          转为待办事项
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>笔记</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          新建
        </Button>
      </div>

      <Search
        placeholder="搜索笔记..."
        allowClear
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
        style={{ marginBottom: 20 }}
      />

      {notes.length === 0 && !loading && (
        <Empty description="暂无笔记，点击新建开始" />
      )}

      {loading && <div style={{ textAlign: 'center', padding: 60 }}>加载中...</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredNotes.map((note) => (
          <Card
            key={note.id}
            size="small"
            bordered={false}
            hoverable
            style={cardStyle}
            styles={{ body: { padding: '14px 20px' } }}
            onClick={() => setDetailNote(note)}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            actions={[
              <Button key="delete" type="text" danger icon={<DeleteOutlined />}
                onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
              >
                删除
              </Button>,
            ]}
          >
            <Card.Meta
              title={
                <Space>
                  <span style={{ color: '#1e293b', fontWeight: 500 }}>{note.title}</span>
                  {note.tags.map((tag) => (
                    <Tag key={tag} style={{ fontSize: 11, borderRadius: 4 }}>{tag}</Tag>
                  ))}
                </Space>
              }
              description={
                <Text type="secondary" ellipsis style={{ fontSize: 13, color: '#94a3b8' }}>
                  {note.content.slice(0, 100) || '（无内容）'}
                </Text>
              }
            />
          </Card>
        ))}
      </div>

      <Modal
        title="新建笔记"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <NoteForm onSubmit={handleAdd} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
