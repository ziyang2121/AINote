import { useState, useEffect } from 'react';
import { Button, Card, Empty, Modal, Typography, Progress, Tag, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useLearningStore } from '@/stores/learningStore';
import type { LearningTask } from '@/types/learning';
import PlanForm from './PlanForm';
import PlanDetail from './PlanDetail';

const { Title, Text } = Typography;

const cardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: 'none',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  transition: 'box-shadow 0.2s, transform 0.15s',
};

export default function LearningPage() {
  const { plans, loading, loadPlans, addPlan, deletePlan } = useLearningStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleAdd = async (values: { title: string; description: string; tasks: LearningTask[] }) => {
    await addPlan({ ...values, checkInDates: [] });
    setModalOpen(false);
  };

  if (selectedPlan) {
    return (
      <PlanDetail
        plan={selectedPlan}
        onBack={() => setSelectedPlanId(null)}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>学习计划</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          新建计划
        </Button>
      </div>

      {plans.length === 0 && !loading && (
        <Empty description="暂无学习计划，点击新建开始" />
      )}

      {loading && <div style={{ textAlign: 'center', padding: 60 }}>加载中...</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {plans.map((plan) => {
          const total = countTasks(plan.tasks);
          const completed = countCompleted(plan.tasks);
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
          const today = new Date().toISOString().slice(0, 10);
          const checkedInToday = plan.checkInDates.includes(today);

          return (
            <Card
              key={plan.id}
              size="small"
              bordered={false}
              hoverable
              style={cardStyle}
              styles={{ body: { padding: '16px 20px' } }}
              onClick={() => setSelectedPlanId(plan.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              actions={[
                <span key="checkin" style={{ color: checkedInToday ? '#10b981' : '#94a3b8' }}>
                  <CheckCircleOutlined /> {checkedInToday ? '已打卡' : '打卡'}
                </span>,
                <span key="delete" onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}>
                  <DeleteOutlined /> 删除
                </span>,
              ]}
            >
              <Card.Meta
                title={
                  <Space>
                    <span style={{ color: '#1e293b', fontWeight: 500 }}>{plan.title}</span>
                    {checkedInToday && <Tag color="success" style={{ borderRadius: 4 }}>今日已打卡</Tag>}
                  </Space>
                }
                description={<span style={{ color: '#94a3b8' }}>{plan.description || '暂无描述'}</span>}
              />
              <div style={{ marginTop: 10 }}>
                <Progress
                  percent={percent}
                  size="small"
                  strokeColor="#f59e0b"
                  trailColor="#fef3c7"
                  showInfo={false}
                />
                <Text type="secondary" style={{ fontSize: 12, color: '#94a3b8' }}>
                  {completed}/{total} 任务完成
                </Text>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        title="新建学习计划"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <PlanForm onSubmit={handleAdd} onCancel={() => setModalOpen(false)} />
      </Modal>
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
