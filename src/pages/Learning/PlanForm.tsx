import { useState } from 'react';
import { Form, Input, Button, Space } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

interface PlanFormProps {
  onSubmit: (values: {
    title: string;
    description: string;
    tasks: Array<{ id: string; title: string; completed: boolean; resources: string[]; subTasks: never[] }>;
  }) => void;
  onCancel: () => void;
}

export default function PlanForm({ onSubmit, onCancel }: PlanFormProps) {
  const [form] = Form.useForm();
  const [taskTitles, setTaskTitles] = useState<string[]>(['']);

  const handleFinish = (values: { title: string; description: string }) => {
    const tasks = taskTitles
      .filter((t) => t.trim())
      .map((t) => ({
        id: crypto.randomUUID(),
        title: t.trim(),
        completed: false,
        resources: [],
        subTasks: [] as never[],
      }));
    onSubmit({
      title: values.title,
      description: values.description || '',
      tasks,
    });
  };

  const addTask = () => {
    setTaskTitles([...taskTitles, '']);
  };

  const removeTask = (index: number) => {
    setTaskTitles(taskTitles.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, value: string) => {
    const updated = [...taskTitles];
    updated[index] = value;
    setTaskTitles(updated);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item name="title" label="计划标题" rules={[{ required: true, message: '请输入计划标题' }]}>
        <Input placeholder="例如：React 学习计划" />
      </Form.Item>
      <Form.Item name="description" label="描述">
        <Input.TextArea rows={3} placeholder="学习目标和计划描述" />
      </Form.Item>
      <Form.Item label="学习任务">
        {taskTitles.map((title, index) => (
          <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
            <Input
              placeholder={`任务 ${index + 1}`}
              value={title}
              onChange={(e) => updateTask(index, e.target.value)}
              style={{ flex: 1 }}
            />
            {taskTitles.length > 1 && (
              <MinusCircleOutlined
                style={{ color: '#ff4d4f' }}
                onClick={() => removeTask(index)}
              />
            )}
          </Space>
        ))}
        <Button type="dashed" onClick={addTask} block icon={<PlusOutlined />}>
          添加任务
        </Button>
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
