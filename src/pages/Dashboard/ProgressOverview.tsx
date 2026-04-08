import { Card, Progress, Empty, List, Tag, Statistic, Row, Col } from 'antd';
import {
  CheckSquareOutlined,
  BookOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTodoStore } from '@/stores/todoStore';
import { useLearningStore } from '@/stores/learningStore';
import { useNoteStore } from '@/stores/noteStore';

const statCardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: 'none',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
};

export default function ProgressOverview() {
  const todos = useTodoStore((s) => s.todos);
  const plans = useLearningStore((s) => s.plans);
  const notes = useNoteStore((s) => s.notes);

  const todoStats = {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    overdue: todos.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
    ).length,
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayTodos = todos.filter((t) => t.dueDate === today && !t.completed);

  return (
    <Row gutter={[16, 16]}>
      {/* 左列：统计卡片 + 今日待办 */}
      <Col xs={24} lg={10}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card size="small" bordered={false} style={{ ...statCardStyle, textAlign: 'center' }}>
              <Statistic
                title="全部待办"
                value={todoStats.total}
                valueStyle={{ color: '#1e293b', fontWeight: 600, fontSize: 28 }}
                prefix={<CheckSquareOutlined style={{ fontSize: 18, color: '#0d9488' }} />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" bordered={false} style={{ ...statCardStyle, textAlign: 'center' }}>
              <Statistic
                title="已完成"
                value={todoStats.completed}
                valueStyle={{ color: '#10b981', fontWeight: 600, fontSize: 28 }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" bordered={false} style={{ ...statCardStyle, textAlign: 'center' }}>
              <Statistic
                title="已逾期"
                value={todoStats.overdue}
                valueStyle={{
                  color: todoStats.overdue > 0 ? '#ef4444' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: 28,
                }}
                prefix={
                  todoStats.overdue > 0 ? (
                    <ExclamationCircleOutlined style={{ fontSize: 18, color: '#ef4444' }} />
                  ) : undefined
                }
              />
            </Card>
          </Col>
        </Row>

        {/* 完成进度条 */}
        <Card
          size="small"
          bordered={false}
          style={{ ...statCardStyle, marginTop: 16 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>完成进度</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              {todoStats.total > 0
                ? `${Math.round((todoStats.completed / todoStats.total) * 100)}%`
                : '—'}
            </span>
          </div>
          <Progress
            percent={todoStats.total > 0 ? Math.round((todoStats.completed / todoStats.total) * 100) : 0}
            size="small"
            strokeColor="#0d9488"
            trailColor="#f1f5f9"
            showInfo={false}
          />
          {todayTodos.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>今日待办</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {todayTodos.map((t) => (
                  <Tag key={t.id} color="processing" style={{ borderRadius: 6 }}>
                    {t.title}
                  </Tag>
                ))}
              </div>
            </div>
          )}
          {todoStats.total === 0 && (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待办事项" />
          )}
        </Card>
      </Col>

      {/* 右列：笔记摘要 + 学习计划 */}
      <Col xs={24} lg={14}>
        {/* 笔记摘要 */}
        <Card
          size="small"
          bordered={false}
          title={
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
              <FileTextOutlined style={{ marginRight: 8, color: '#0ea5e9' }} />
              最近笔记
            </span>
          }
          extra={<Tag color="cyan" style={{ borderRadius: 6 }}>{notes.length} 条</Tag>}
          style={statCardStyle}
        >
          {notes.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无笔记" />
          ) : (
            <List
              size="small"
              dataSource={notes.slice(0, 5)}
              renderItem={(note) => (
                <List.Item style={{ padding: '8px 0' }}>
                  <List.Item.Meta
                    title={
                      <span style={{ fontSize: 14, color: '#1e293b' }}>{note.title}</span>
                    }
                    description={
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>
                        {note.content.slice(0, 60) + (note.content.length > 60 ? '...' : '')}
                      </span>
                    }
                  />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {note.tags.slice(0, 2).map((tag) => (
                      <Tag key={tag} style={{ borderRadius: 4, fontSize: 11, margin: 0 }}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* 学习计划进度 */}
        <Card
          size="small"
          bordered={false}
          title={
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
              <BookOutlined style={{ marginRight: 8, color: '#f59e0b' }} />
              学习计划
            </span>
          }
          extra={<Tag color="gold" style={{ borderRadius: 6 }}>{plans.length} 个</Tag>}
          style={{ ...statCardStyle, marginTop: 16 }}
        >
          {plans.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无学习计划" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {plans.map((plan) => {
                const totalTasks = countTasks(plan.tasks);
                const completedTasks = countCompletedTasks(plan.tasks);
                const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                return (
                  <div key={plan.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>
                        {plan.title}
                      </span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        {completedTasks}/{totalTasks}
                      </span>
                    </div>
                    <Progress
                      percent={percent}
                      size="small"
                      strokeColor="#f59e0b"
                      trailColor="#fef3c7"
                      showInfo={false}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
}

interface TaskItem {
  completed: boolean;
  subTasks?: TaskItem[];
}

function countTasks(tasks: TaskItem[]): number {
  return tasks.reduce((sum, t) => sum + 1 + countTasks(t.subTasks ?? []), 0);
}

function countCompletedTasks(tasks: TaskItem[]): number {
  return tasks.reduce(
    (sum, t) => sum + (t.completed ? 1 : 0) + countCompletedTasks(t.subTasks ?? []),
    0
  );
}
