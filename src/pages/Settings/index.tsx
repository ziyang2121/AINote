import { Typography, Form, Input, Select, Button, Card, Space, message, Divider } from 'antd';
import { KeyOutlined, RobotOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useSettingsStore } from '@/stores/settingsStore';

const { Title, Text } = Typography;

const modelOptions = [
  { label: 'GLM-4-Flash (免费)', value: 'glm-4-flash' },
  { label: 'GLM-4-Plus', value: 'glm-4-plus' },
  { label: 'GLM-4', value: 'glm-4' },
  { label: 'GLM-4-Air', value: 'glm-4-air' },
  { label: 'GLM-4-Long', value: 'glm-4-long' },
];

const cardStyle: React.CSSProperties = {
  maxWidth: 520,
  borderRadius: 14,
  border: 'none',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
};

export default function SettingsPage() {
  const { apiKey, model, setApiKey, setModel } = useSettingsStore();
  const [messageApi, contextHolder] = message.useMessage();

  const handleSave = () => {
    if (!apiKey.trim()) {
      messageApi.warning('请输入 API Key');
      return;
    }
    messageApi.success('设置已保存');
  };

  return (
    <div>
      {contextHolder}
      <Title level={3} style={{ fontWeight: 600, color: '#1e293b', marginBottom: 24 }}>设置</Title>

      <Card bordered={false} style={cardStyle} styles={{ body: { padding: '24px 28px' } }}>
        <Space style={{ marginBottom: 20 }}>
          <RobotOutlined style={{ fontSize: 20, color: '#0d9488' }} />
          <Title level={5} style={{ margin: 0, color: '#1e293b' }}>AI 服务配置</Title>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginBottom: 20, lineHeight: 1.6 }}>
          配置智谱 AI 的 API Key 和模型。API Key 可在
          <a href="https://open.bigmodel.cn" target="_blank" rel="noreferrer" style={{ color: '#0d9488' }}>
            {' '}智谱开放平台{' '}
          </a>
          获取。
        </Text>

        <Form layout="vertical" initialValues={{ apiKey, model }}>
          <Form.Item label={<span><KeyOutlined style={{ marginRight: 6 }} />API Key</span>}>
            <Input.Password
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入你的智谱 API Key"
            />
          </Form.Item>
          <Form.Item label={<span><RobotOutlined style={{ marginRight: 6 }} />模型</span>}>
            <Select
              value={model}
              onChange={setModel}
              options={modelOptions}
            />
          </Form.Item>
          <Form.Item style={{ marginTop: 8 }}>
            <Button type="primary" onClick={handleSave} style={{ borderRadius: 8 }}>
              保存设置
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '20px 0 16px' }} />

        <Space direction="vertical" size={6}>
          <Space size={6}>
            <SafetyCertificateOutlined style={{ color: '#10b981' }} />
            <Text type="secondary" style={{ fontSize: 13 }}>API Key 仅存储在浏览器本地，不会发送到任何第三方服务器。</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 13 }}>
            智谱 API 文档：
            <a href="https://docs.bigmodel.cn" target="_blank" rel="noreferrer" style={{ color: '#0d9488' }}>
              {' '}docs.bigmodel.cn
            </a>
          </Text>
        </Space>
      </Card>
    </div>
  );
}
