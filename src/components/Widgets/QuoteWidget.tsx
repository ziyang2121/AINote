import { useState, useEffect } from 'react';
import { Card } from 'antd';

const quotes = [
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: '知之者不如好之者，好之者不如乐之者。', author: '孔子' },
  { text: '天行健，君子以自强不息。', author: '《周易》' },
  { text: '不积跬步，无以至千里。', author: '荀子' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
  { text: '锲而不舍，金石可镂。', author: '荀子' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
  { text: '博学之，审问之，慎思之，明辨之，笃行之。', author: '《中庸》' },
  { text: '三人行，必有我师焉。', author: '孔子' },
  { text: '温故而知新，可以为师矣。', author: '孔子' },
  { text: '己所不欲，勿施于人。', author: '孔子' },
  { text: '敏而好学，不耻下问。', author: '孔子' },
  { text: '读万卷书，行万里路。', author: '刘彝' },
  { text: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈' },
  { text: '有志者事竟成。', author: '《后汉书》' },
  { text: '生于忧患，死于安乐。', author: '孟子' },
  { text: '工欲善其事，必先利其器。', author: '孔子' },
  { text: '少壮不努力，老大徒伤悲。', author: '《长歌行》' },
  { text: '莫等闲，白了少年头，空悲切。', author: '岳飞' },
];

export default function QuoteWidget() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * quotes.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % quotes.length);
        setVisible(true);
      }, 300);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const quote = quotes[index]!;

  return (
    <Card
      size="small"
      bordered={false}
      style={{
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        borderRadius: 14,
      }}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          fontStyle: 'italic',
        }}
      >
        <div style={{ fontSize: 14, lineHeight: 1.8, color: '#92400e' }}>
          &ldquo;{quote.text}&rdquo;
        </div>
        <div style={{ fontSize: 12, color: '#b45309', textAlign: 'right', marginTop: 4 }}>
          &mdash; {quote.author}
        </div>
      </div>
    </Card>
  );
}
