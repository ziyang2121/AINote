import { useState, useEffect } from 'react';
import { Card } from 'antd';
import dayjs from 'dayjs';

export default function ClockWidget() {
  const [time, setTime] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => setTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card
      size="small"
      bordered={false}
      style={{
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)',
        borderRadius: 14,
      }}
    >
      <div
        style={{
          fontSize: 36,
          fontWeight: 200,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: 3,
          color: '#0f766e',
        }}
      >
        {time.format('HH:mm:ss')}
      </div>
      <div style={{ fontSize: 13, color: '#5eead4', marginTop: 6, letterSpacing: 0.5 }}>
        {time.format('YYYY年M月D日 dddd')}
      </div>
    </Card>
  );
}
