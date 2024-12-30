import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// 註冊 Chart.js 必要元件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function App() {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [price, setPrice] = useState(0);
  const [change, setChange] = useState(0);
  const [changePercent, setChangePercent] = useState(0);
  const [hoverPrice, setHoverPrice] = useState(0); // 滑鼠懸停價格
  const [selectedRange, setSelectedRange] = useState('30');
  const [error, setError] = useState(null); // 儲存錯誤訊息

  useEffect(() => {
    fetchData(selectedRange);
  }, [selectedRange]);

  const fetchData = async (days) => {
    try {
      setError(null); // 清除之前的錯誤訊息
      let apiUrl = '';
  
      if (days === '1') {
        const today = new Date();
        const startOfDay = Math.floor(new Date(today.setHours(0, 0, 0, 0)).getTime() / 1000);
        const endOfDay = Math.floor(new Date(today.setHours(23, 59, 59, 999)).getTime() / 1000);
        apiUrl = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${startOfDay}&to=${endOfDay}`;
      } else {
        apiUrl = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`;
      }
  
      const response = await axios.get(apiUrl);
      const data = response.data;
  
      if (!data.prices || data.prices.length === 0) {
        throw new Error('無法獲取資料，請稍後再試');
      }
  
      const prices = data.prices;
      const latestPrice = prices[prices.length - 1][1];
      const initialPrice = prices[0][1];
      const priceChange = latestPrice - initialPrice;
      const changePercentage = ((priceChange / initialPrice) * 100).toFixed(2);
  
      setPrice(latestPrice);
      setChange(priceChange);
      setChangePercent(changePercentage);
  
      setChartData({
        labels: prices.map(item => {
          if (days === '1') {
            return new Date(item[0]).toLocaleTimeString(); // 當天範圍顯示時間
          } else {
            return new Date(item[0]).toLocaleDateString(); // 其他範圍顯示日期
          }
        }),
        datasets: [
          {
            label: 'Bitcoin Price (USD)',
            data: prices.map(item => item[1]),
            borderColor: priceChange >= 0 ? '#4CAF50' : '#FF5252',
            backgroundColor: priceChange >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 82, 82, 0.2)',
            pointRadius: 0,
            fill: true,
            tension: 0.4,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setError(error.message || '發生未知錯誤，請稍後再試');
    }
  };  

  const handleRangeChange = (range) => {
    setSelectedRange(range);
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        intersect: false,
        mode: 'index',
        callbacks: {
          label: (context) => {
            const price = context.raw;
            setHoverPrice(price); // 更新懸停價格
            return `$${price.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        grid: {
          color: 'rgba(200, 200, 200, 0.3)',
        },
        ticks: {
          callback: (value) => `$${value.toLocaleString()}`,
        },
      },
    },
    hover: {
      mode: 'index',
      intersect: false,
      onHover: (event, chartElement) => {
        if (chartElement.length > 0) {
          const index = chartElement[0].index;
          const price = chartData.datasets[0].data[index];
          setHoverPrice(price); // 更新滑鼠懸停價格
        }
      },
    },
    events: ['mousemove', 'mouseout'], // 監聽滑鼠移動和離開事件
  };  

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      {/* 錯誤訊息區塊 */}
      {error && (
        <div style={{
          background: '#FFCDD2',
          color: '#D32F2F',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '10px',
          textAlign: 'center',
          fontWeight: 'bold',
        }}>
          ⚠️ {error}
        </div>
      )}
  
      {/* 上方資訊區塊 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
        <div>
          <h2>Bitcoin (BTC)</h2>
          <h1 style={{ margin: '0' }}>
            ${hoverPrice ? hoverPrice.toLocaleString() : price.toLocaleString()}
          </h1>
          <p style={{ color: change >= 0 ? 'green' : 'red' }}>
            {change >= 0 ? '+' : '-'}${Math.abs(change).toLocaleString()} ({changePercent}%)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '5px', background: '#f5f5f5', borderRadius: '8px', padding: '5px' }}>
          {[
            { label: '1D', value: '1' },
            { label: '7D', value: '7' },
            { label: '14D', value: '14' },
            { label: '30D', value: '30' },
            { label: '90D', value: '90' },
            { label: '180D', value: '180' },
            { label: '1Y', value: '365' },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => handleRangeChange(range.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '5px',
                border: 'none',
                background: selectedRange === range.value ? '#fff' : 'transparent',
                color: selectedRange === range.value ? '#000' : '#888',
                fontWeight: selectedRange === range.value ? 'bold' : 'normal',
                boxShadow: selectedRange === range.value ? '0 2px 5px rgba(0, 0, 0, 0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
  
      {/* 下方圖表區塊 */}
      <div
        style={{ height: '400px' }}
        onMouseLeave={() => setHoverPrice(price)} // 滑鼠離開時重置價格
      >
        {chartData.labels.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <p>Loading chart data...</p>
        )}
      </div>
    </div>
  );  
}

export default App;
