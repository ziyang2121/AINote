import { Card, Button, Space, Typography, Tag } from 'antd';
import { CheckOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import type { AiAction } from '@/types/ai';

const { Text } = Typography;

interface ActionPreviewProps {
  action: AiAction;
  onConfirm: () => void;
  onCancel: () => void;
}

const typeLabels: Record<string, string> = {
  add_todo: '创建待办',
  update_todo: '修改待办',
  delete_todo: '删除待办',
  add_plan: '创建计划',
  update_plan: '修改计划',
  delete_plan: '删除计划',
  add_memo: '创建备忘录',
  update_memo: '修改备忘录',
  delete_memo: '删除备忘录',
};

const typeColors: Record<string, string> = {
  add_todo: 'cyan',
  update_todo: 'orange',
  delete_todo: 'red',
  add_plan: 'gold',
  update_plan: 'orange',
  delete_plan: 'red',
  add_memo: 'blue',
  update_memo: 'orange',
  delete_memo: 'red',
};

export default function ActionPreview({ action, onConfirm, onCancel }: ActionPreviewProps) {
  return (
    <Card
      size="small"
      style={{
        marginBottom: 6,
        borderRadius: 10,
        border: 'none',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
      styles={{ body: { padding: '10px 14px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <Space size={6}>
            <Tag color={typeColors[action.type]} style={{ borderRadius: 4, fontSize: 11 }}>
              {typeLabels[action.type]}
            </Tag>
            <Text style={{ fontSize: 13, color: '#334155' }}>{action.description}</Text>
          </Space>
        </div>
        <Space size={4}>
          {action.status === 'pending' && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={onConfirm}
                style={{ borderRadius: 6 }}
              >
                执行
              </Button>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={onCancel}
                style={{ borderRadius: 6 }}
              >
                取消
              </Button>
            </>
          )}
          {action.status === 'confirmed' && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <LoadingOutlined /> 执行中...
            </Text>
          )}
          {action.status === 'executed' && (
            <Tag color="success" icon={<CheckOutlined />} style={{ borderRadius: 4 }}>
              已执行
            </Tag>
          )}
          {action.status === 'cancelled' && (
            <Tag style={{ borderRadius: 4 }}>已取消</Tag>
          )}
        </Space>
      </div>
    </Card>
  );
}
