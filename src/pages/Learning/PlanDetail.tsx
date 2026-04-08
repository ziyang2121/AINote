import { useState } from 'react';
import { Button, Card, Checkbox, Typography, Space, Modal, Input, Empty, Tag, Statistic, Row, Col } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, CheckCircleFilled, FireOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { LearningPlan, LearningTask } from '@/types/learning';
import { useLearningStore } from '@/stores/learningStore';

const { Title, Text } = Typography;

const cardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: 'none',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
};

interface PlanDetailProps {
  plan: LearningPlan;
  onBack: () => void;
}

export default function PlanDetail({ plan, onBack }: PlanDetailProps) {
  const { updatePlan } = useLearningStore();
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const checkedInToday = plan.checkInDates.includes(today);
  const total = countTasks(plan.tasks);
  const completed = countCompleted(plan.tasks);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const streak = calculateStreak(plan.checkInDates);

  const handleCheckIn = () => {
    if (checkedInToday) return;
    updatePlan(plan.id, {
      checkInDates: [...plan.checkInDates, today],
    });
  };

  const handleToggleTask = (taskId: string) => {
    const toggle = (tasks: LearningTask[]): LearningTask[] =>
      tasks.map((t) => {
        if (t.id === taskId) return { ...t, completed: !t.completed };
        if (t.subTasks.length > 0) return { ...t, subTasks: toggle(t.subTasks) };
        return t;
      });
    updatePlan(plan.id, { tasks: toggle(plan.tasks) });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: LearningTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      completed: false,
      resources: [],
      subTasks: [],
    };
    updatePlan(plan.id, { tasks: [...plan.tasks, newTask] });
    setNewTaskTitle('');
    setAddTaskOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    const remove = (tasks: LearningTask[]): LearningTask[] =>
      tasks.filter((t) => t.id !== taskId).map((t) => ({
        ...t,
        subTasks: remove(t.subTasks),
      }));
    updatePlan(plan.id, { tasks: remove(plan.tasks) });
  };

  return (
    <div>
      <Space style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} type="text">返回</Button>
        <Title level={3} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{plan.title}</Title>
      </Space>

      {plan.description && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 20, color: '#94a3b8' }}>
          {plan.description}
        </Text>
      )}

      {/* 统计卡片 */}
      <Row gutter={12} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card size="small" bordered={false} style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic
              title="任务进度"
              value={completed}
              suffix={<span style={{ fontSize: 14, color: '#94a3b8' }}>/ {total}</span>}
              valueStyle={{ color: '#1e293b', fontWeight: 600, fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered={false} style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic
              title="完成率"
              value={percent}
              suffix="%"
              valueStyle={{ color: '#f59e0b', fontWeight: 600, fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered={false} style={{ ...cardStyle, textAlign: 'center' }}>
            <Statistic
              title="连续打卡"
              value={streak}
              suffix="天"
              prefix={<FireOutlined style={{ fontSize: 16, color: '#f97316' }} />}
              valueStyle={{ color: '#f97316', fontWeight: 600, fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            bordered={false}
            style={{ ...cardStyle, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Button
              type={checkedInToday ? 'default' : 'primary'}
              icon={<CheckCircleFilled />}
              onClick={handleCheckIn}
              disabled={checkedInToday}
              size="large"
              block
              style={{
                height: 48,
                borderRadius: 10,
                fontWeight: 500,
              }}
            >
              {checkedInToday ? '今日已打卡' : '今日打卡'}
            </Button>
          </Card>
        </Col>
      </Row>

      {/* 打卡日历 */}
      <Card
        size="small"
        bordered={false}
        title={
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>打卡日历</span>
        }
        style={{ ...cardStyle, marginBottom: 20 }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {Array.from({ length: 30 }, (_, i) => {
            const date = dayjs().subtract(29 - i, 'day').format('YYYY-MM-DD');
            const checked = plan.checkInDates.includes(date);
            return (
              <div
                key={date}
                title={date}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  backgroundColor: checked ? '#f59e0b' : '#f1f5f9',
                  transition: 'background-color 0.2s',
                }}
              />
            );
          })}
        </div>
      </Card>

      {/* 任务列表 */}
      <Card
        size="small"
        bordered={false}
        title={
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>学习任务</span>
        }
        extra={
          <Button type="link" icon={<PlusOutlined />} onClick={() => setAddTaskOpen(true)}>
            添加任务
          </Button>
        }
        style={cardStyle}
        styles={{ body: { padding: '16px 20px' } }}
      >
        {plan.tasks.length === 0 ? (
          <Empty description="暂无学习任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {plan.tasks.map((task) => (
              <TaskItemRow
                key={task.id}
                task={task}
                depth={0}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </Card>

      <Modal
        title="添加学习任务"
        open={addTaskOpen}
        onOk={handleAddTask}
        onCancel={() => { setAddTaskOpen(false); setNewTaskTitle(''); }}
        okText="添加"
        cancelText="取消"
      >
        <Input
          placeholder="输入任务标题"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onPressEnter={handleAddTask}
          autoFocus
        />
      </Modal>
    </div>
  );
}

function TaskItemRow({
  task,
  depth,
  onToggle,
  onDelete,
}: {
  task: LearningTask;
  depth: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingLeft: depth * 24,
          padding: '6px 8px',
          borderRadius: 8,
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Checkbox checked={task.completed} onChange={() => onToggle(task.id)} />
        <Text
          delete={task.completed}
          style={{ flex: 1, fontSize: depth > 0 ? 13 : 14, color: task.completed ? '#94a3b8' : '#1e293b' }}
        >
          {task.title}
        </Text>
        {task.resources.length > 0 && (
          <Tag color="blue" style={{ fontSize: 11, borderRadius: 4 }}>{task.resources.length} 资源</Tag>
        )}
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(task.id)}
          style={{ color: '#cbd5e1' }}
        />
      </div>
      {task.subTasks.map((sub) => (
        <TaskItemRow
          key={sub.id}
          task={sub}
          depth={depth + 1}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function countTasks(tasks: LearningTask[]): number {
  return tasks.reduce((sum, t) => sum + 1 + countTasks(t.subTasks), 0);
}

function countCompleted(tasks: LearningTask[]): number {
  return tasks.reduce(
    (sum, t) => sum + (t.completed ? 1 : 0) + countCompleted(t.subTasks),
    0
  );
}

function calculateStreak(checkInDates: string[]): number {
  if (checkInDates.length === 0) return 0;
  const sorted = [...checkInDates].sort().reverse();
  let streak = 0;
  let current = dayjs();

  const today = current.format('YYYY-MM-DD');
  if (sorted[0] !== today) {
    current = current.subtract(1, 'day');
  }

  for (const date of sorted) {
    if (date === current.format('YYYY-MM-DD')) {
      streak++;
      current = current.subtract(1, 'day');
    } else if (date < current.format('YYYY-MM-DD')) {
      break;
    }
  }

  return streak;
}
