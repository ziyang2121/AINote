import { useEffect } from 'react';
import { Form, Input, DatePicker, Select, Space, Button } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

interface TodoFormProps {
  initialValues?: {
    title: string;
    description: string;
    content: string;
    priority: 1 | 2 | 3 | 4 | 5;
    dueDate: string | null;
    tags: string[];
  };
  onSubmit: (values: {
    title: string;
    description: string;
    content: string;
    priority: 1 | 2 | 3 | 4 | 5;
    dueDate: string | null;
    tags: string[];
  }) => void;
  onCancel?: () => void;
}

const priorityOptions = [
  { label: 'P1 紧急', value: 1 },
  { label: 'P2 高', value: 2 },
  { label: 'P3 中', value: 3 },
  { label: 'P4 低', value: 4 },
  { label: 'P5 最低', value: 5 },
];

const priorityColors: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#f59e0b',
  4: '#10b981',
  5: '#94a3b8',
};

export { priorityColors };

export default function TodoForm({ initialValues, onSubmit, onCancel }: TodoFormProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        dueDate: initialValues.dueDate ? dayjs(initialValues.dueDate) : null,
      });
    }
  }, [initialValues, form]);

  const handleFinish = (values: {
    title: string;
    description?: string;
    content?: string;
    priority: number;
    dueDate?: Dayjs;
    tags?: string[];
  }) => {
    onSubmit({
      title: values.title,
      description: values.description || '',
      content: values.content || '',
      priority: values.priority as 1 | 2 | 3 | 4 | 5,
      dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
      tags: values.tags || [],
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        title: '',
        description: '',
        content: '',
        priority: 3,
        tags: [],
      }}
    >
      <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入待办标题' }]}>
        <Input placeholder="输入待办事项标题" />
      </Form.Item>
      <Form.Item name="description" label="描述">
        <Input.TextArea rows={3} placeholder="补充描述（可选）" />
      </Form.Item>
      <Form.Item name="content" label="详细内容">
        <Input.TextArea rows={4} placeholder="详细内容/备注（可选）" />
      </Form.Item>
      <Space style={{ width: '100%' }} size="large">
        <Form.Item name="priority" label="优先级">
          <Select options={priorityOptions} style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="dueDate" label="截止日期">
          <DatePicker style={{ width: 180 }} />
        </Form.Item>
      </Space>
      <Form.Item name="tags" label="标签">
        <Select mode="tags" placeholder="输入标签后按回车" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 8 }}>
        <Space>
          {onCancel && <Button onClick={onCancel}>取消</Button>}
          <Button type="primary" htmlType="submit">{initialValues ? '保存' : '添加'}</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
