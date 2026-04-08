import { useEffect } from 'react';
import { Row, Col, Typography } from 'antd';
import ClockWidget from '@/components/Widgets/ClockWidget';
import QuoteWidget from '@/components/Widgets/QuoteWidget';
import WeatherWidget from '@/components/Widgets/WeatherWidget';
import AiChatWindow from '@/components/AiChat/AiChatWindow';
import ProgressOverview from './ProgressOverview';
import { useTodoStore } from '@/stores/todoStore';
import { useLearningStore } from '@/stores/learningStore';
import { useNoteStore } from '@/stores/noteStore';

const { Title } = Typography;

export default function Dashboard() {
  const loadTodos = useTodoStore((s) => s.loadTodos);
  const loadPlans = useLearningStore((s) => s.loadPlans);
  const loadNotes = useNoteStore((s) => s.loadNotes);

  useEffect(() => {
    loadTodos();
    loadPlans();
    loadNotes();
  }, [loadTodos, loadPlans, loadNotes]);

  return (
    <div>
      {/* 装饰展示区 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        <Col xs={24} sm={8}>
          <ClockWidget />
        </Col>
        <Col xs={24} sm={8}>
          <WeatherWidget />
        </Col>
        <Col xs={24} sm={8}>
          <QuoteWidget />
        </Col>
      </Row>

      {/* 进度展示区 */}
      <Title
        level={4}
        style={{ marginTop: 0, marginBottom: 20, fontWeight: 600, color: '#1e293b' }}
      >
        进度概览
      </Title>
      <ProgressOverview />

      {/* AI 对话浮动窗口 */}
      <AiChatWindow />
    </div>
  );
}
