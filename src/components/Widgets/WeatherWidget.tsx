import { useState, useEffect } from 'react';
import { Card, Spin } from 'antd';
import {
  SunOutlined,
  CloudOutlined,
  CloudFilled,
  ThunderboltOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

const weatherIcons: Record<string, React.ReactNode> = {
  '113': <SunOutlined style={{ fontSize: 28, color: '#f59e0b' }} />,
  '116': <CloudOutlined style={{ fontSize: 28, color: '#94a3b8' }} />,
  '119': <CloudOutlined style={{ fontSize: 28, color: '#64748b' }} />,
  '122': <CloudOutlined style={{ fontSize: 28, color: '#cbd5e1' }} />,
  '176': <CloudFilled style={{ fontSize: 28, color: '#0ea5e9' }} />,
  '263': <CloudFilled style={{ fontSize: 28, color: '#0ea5e9' }} />,
  '266': <CloudFilled style={{ fontSize: 28, color: '#38bdf8' }} />,
  '293': <CloudFilled style={{ fontSize: 28, color: '#38bdf8' }} />,
  '296': <CloudFilled style={{ fontSize: 28, color: '#0ea5e9' }} />,
  '299': <CloudFilled style={{ fontSize: 28, color: '#0284c7' }} />,
  '302': <CloudFilled style={{ fontSize: 28, color: '#0284c7' }} />,
  '305': <CloudFilled style={{ fontSize: 28, color: '#0369a1' }} />,
  '308': <ThunderboltOutlined style={{ fontSize: 28, color: '#f59e0b' }} />,
  '311': <CloudOutlined style={{ fontSize: 28, color: '#7dd3fc' }} />,
  '320': <CloudOutlined style={{ fontSize: 28, color: '#bae6fd' }} />,
  '353': <CloudFilled style={{ fontSize: 28, color: '#0ea5e9' }} />,
  '356': <CloudFilled style={{ fontSize: 28, color: '#0284c7' }} />,
  '359': <ThunderboltOutlined style={{ fontSize: 28, color: '#f59e0b' }} />,
  '386': <ThunderboltOutlined style={{ fontSize: 28, color: '#f59e0b' }} />,
  '389': <ThunderboltOutlined style={{ fontSize: 28, color: '#dc2626' }} />,
};

interface WeatherData {
  temp: string;
  desc: string;
  iconCode: string;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://wttr.in/?format=j1')
      .then((res) => res.json())
      .then((data) => {
        const current = data.current_condition[0];
        setWeather({
          temp: current.temp_C,
          desc: current.lang_zh?.[0]?.value || current.weatherDesc[0].value,
          iconCode: current.weatherCode,
        });
      })
      .catch(() => setWeather(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card
      size="small"
      bordered={false}
      style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        borderRadius: 14,
      }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <Spin size="small" />
        </div>
      ) : weather ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {weatherIcons[weather.iconCode] || <QuestionCircleOutlined style={{ fontSize: 28, color: '#94a3b8' }} />}
          <div>
            <div style={{ fontSize: 26, fontWeight: 200, color: '#0369a1' }}>{weather.temp}°C</div>
            <div style={{ fontSize: 12, color: '#0284c7' }}>{weather.desc}</div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: '#94a3b8' }}>天气信息不可用</div>
      )}
    </Card>
  );
}
