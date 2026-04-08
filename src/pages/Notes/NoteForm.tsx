import { Form, Input, Button, Space, Select } from 'antd';

interface NoteFormProps {
  onSubmit: (values: { title: string; content: string; tags: string[] }) => void;
  onCancel: () => void;
}

export default function NoteForm({ onSubmit, onCancel }: NoteFormProps) {
  const [form] = Form.useForm();

  const handleFinish = (values: { title: string; content?: string; tags?: string[] }) => {
    onSubmit({
      title: values.title,
      content: values.content || '',
      tags: values.tags || [],
    });
    form.resetFields();
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入笔记标题' }]}>
        <Input placeholder="输入笔记标题" />
      </Form.Item>
      <Form.Item name="content" label="内容">
        <Input.TextArea rows={8} placeholder="输入笔记内容（支持 Markdown）" />
      </Form.Item>
      <Form.Item name="tags" label="标签">
        <Select mode="tags" placeholder="输入标签后按回车" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit">创建</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
