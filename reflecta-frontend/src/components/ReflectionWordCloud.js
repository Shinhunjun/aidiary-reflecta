import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import './ReflectionWordCloud.css';

const ReflectionWordCloud = ({ goalId }) => {
  const [wordData, setWordData] = useState({ current: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'recent', 'comparison'

  useEffect(() => {
    if (goalId) {
      fetchReflectionWords();
    }
  }, [goalId, timeRange]);

  const fetchReflectionWords = async () => {
    try {
      setLoading(true);
      const journalData = await apiService.getGoalJournals(goalId);

      if (!journalData || journalData.length === 0) {
        setWordData({ current: [], past: [] });
        setLoading(false);
        return;
      }

      // Extract words from journal entries (title and content)
      const extractWords = (entries) => {
        const text = entries
          .map((entry) => {
            const title = entry.title || '';
            const content = entry.content || '';
            return `${title} ${content}`;
          })
          .join(' ');

        // Simple word extraction and frequency counting
        const words = text
          .toLowerCase()
          .replace(/[^a-z\s]/g, '')
          .split(/\s+/)
          .filter((word) => word.length > 3); // Filter short words

        // Common stop words to exclude
        const stopWords = new Set([
          'that',
          'this',
          'with',
          'from',
          'have',
          'been',
          'were',
          'your',
          'will',
          'would',
          'could',
          'should',
          'about',
          'there',
          'their',
          'which',
          'when',
          'where',
          'what',
          'more',
          'some',
          'into',
          'just',
          'only',
          'very',
          'much',
          'than',
        ]);

        const wordFreq = {};
        words.forEach((word) => {
          if (!stopWords.has(word)) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
          }
        });

        // Convert to array and sort by frequency
        return Object.entries(wordFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 40) // Top 40 words
          .map(([word, count]) => ({ word, count }));
      };

      if (timeRange === 'comparison') {
        // Split data: last 3 months vs previous 3 months
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentEntries = journalData.filter(
          (entry) => new Date(entry.createdAt || entry.date) >= threeMonthsAgo
        );

        const pastEntries = journalData.filter(
          (entry) =>
            new Date(entry.createdAt || entry.date) < threeMonthsAgo &&
            new Date(entry.createdAt || entry.date) >= sixMonthsAgo
        );

        setWordData({
          current: extractWords(recentEntries),
          past: extractWords(pastEntries),
        });
      } else if (timeRange === 'recent') {
        // Last 3 months only
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const recentEntries = journalData.filter(
          (entry) => new Date(entry.createdAt || entry.date) >= threeMonthsAgo
        );

        setWordData({
          current: extractWords(recentEntries),
          past: [],
        });
      } else {
        // All time
        setWordData({
          current: extractWords(journalData),
          past: [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch reflection words:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFontSize = (count, maxCount) => {
    const minSize = 14;
    const maxSize = 48;
    const ratio = count / maxCount;
    return minSize + ratio * (maxSize - minSize);
  };

  const getColor = (index, total) => {
    const colors = [
      '#6c5ce7',
      '#a29bfe',
      '#fd79a8',
      '#fdcb6e',
      '#00b894',
      '#74b9ff',
      '#e17055',
      '#00cec9',
    ];
    return colors[index % colors.length];
  };

  const renderWordCloud = (words, title) => {
    if (words.length === 0) {
      return (
        <div className="word-cloud-empty">
          <p>Not enough reflections yet to generate a word cloud.</p>
        </div>
      );
    }

    const maxCount = Math.max(...words.map((w) => w.count));

    return (
      <div className="word-cloud-section">
        {title && <h3 className="cloud-title">{title}</h3>}
        <div className="word-cloud">
          {words.map((item, index) => (
            <span
              key={index}
              className="cloud-word"
              style={{
                fontSize: `${getFontSize(item.count, maxCount)}px`,
                color: getColor(index, words.length),
                margin: '8px 12px',
                display: 'inline-block',
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
              }}
              title={`Mentioned ${item.count} times`}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              {item.word}
            </span>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="reflection-cloud-loading">
        <div className="spinner"></div>
        <p>Analyzing your reflections...</p>
      </div>
    );
  }

  return (
    <div className="reflection-word-cloud-container">
      <div className="cloud-header">
        <div className="header-text">
          <h2>💭 Words of Your Journey</h2>
          <p className="cloud-subtitle">
            The language that shapes your reflections
          </p>
        </div>
        <div className="time-range-selector">
          <button
            className={`range-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
          <button
            className={`range-btn ${timeRange === 'recent' ? 'active' : ''}`}
            onClick={() => setTimeRange('recent')}
          >
            Last 3 Months
          </button>
          <button
            className={`range-btn ${timeRange === 'comparison' ? 'active' : ''}`}
            onClick={() => setTimeRange('comparison')}
          >
            Compare Periods
          </button>
        </div>
      </div>

      {timeRange === 'comparison' ? (
        <div className="comparison-view">
          {wordData.past.length > 0 ? (
            <>
              {renderWordCloud(wordData.past, '3-6 Months Ago')}
              <div className="comparison-divider">
                <span className="divider-icon">→</span>
              </div>
              {renderWordCloud(wordData.current, 'Last 3 Months')}
              {wordData.current.length > 0 && wordData.past.length > 0 && (
                <div className="comparison-insight">
                  <h4>✨ Your Language Evolution</h4>
                  <p>
                    Compare the words you used then and now. Notice how your
                    focus and perspective have shifted over time.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="comparison-insufficient">
              <p>
                Not enough historical data for comparison. Keep reflecting to
                see how your language evolves!
              </p>
              {wordData.current.length > 0 &&
                renderWordCloud(wordData.current, 'Recent Reflections')}
            </div>
          )}
        </div>
      ) : (
        renderWordCloud(wordData.current)
      )}

      {wordData.current.length > 0 && (
        <div className="cloud-footer">
          <p className="footer-text">
            💡 <strong>Tip:</strong> The larger the word, the more frequently
            it appears in your reflections. These words reveal what matters most
            to you in this goal.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReflectionWordCloud;
