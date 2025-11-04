import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import apiService from '../services/api';
import './EmotionalJourneyMap.css';

const EmotionalJourneyMap = ({ goalId }) => {
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);

  useEffect(() => {
    fetchEmotionalJourney();
  }, [goalId]);

  const fetchEmotionalJourney = async () => {
    try {
      setLoading(true);
      const data = await apiService.getGoalEmotionalJourney(goalId);
      setJourneyData(data);
    } catch (error) {
      console.error('Failed to fetch emotional journey:', error);
    } finally {
      setLoading(false);
    }
  };

  const moodColors = {
    happy: '#FFD93D',
    excited: '#FF6B9D',
    grateful: '#A8E6CF',
    calm: '#95E1D3',
    neutral: '#B8B8D0',
    reflective: '#9896F1',
    anxious: '#FFB6B9',
    sad: '#C7CEEA',
  };

  const getMoodGradient = (mood) => {
    return moodColors[mood] || moodColors.neutral;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="emotional-journey-tooltip">
          <p className="tooltip-date">
            {new Date(data.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="tooltip-mood">
            <span className="mood-emoji">
              {data.mood === 'happy'
                ? '😊'
                : data.mood === 'excited'
                ? '🎉'
                : data.mood === 'grateful'
                ? '🙏'
                : data.mood === 'calm'
                ? '😌'
                : data.mood === 'anxious'
                ? '😰'
                : data.mood === 'sad'
                ? '😢'
                : data.mood === 'reflective'
                ? '🤔'
                : '😐'}
            </span>
            {data.mood}
          </p>
          <p className="tooltip-title">{data.title}</p>
          {data.notes && (
            <p className="tooltip-notes">{data.notes.slice(0, 100)}...</p>
          )}
          {data.isMilestone && (
            <p className="tooltip-milestone">
              {data.celebrationEmoji} Milestone!
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const handlePointClick = (data) => {
    setSelectedPoint(data);
  };

  if (loading) {
    return (
      <div className="emotional-journey-loading">
        <div className="spinner"></div>
        <p>Loading your emotional journey...</p>
      </div>
    );
  }

  if (!journeyData || journeyData.journey.length === 0) {
    return (
      <div className="emotional-journey-empty">
        <div className="empty-icon">🌱</div>
        <h3>Your journey begins here</h3>
        <p>
          Start logging your progress to see your emotional journey visualized
          over time.
        </p>
      </div>
    );
  }

  const { journey, moodTrend, significantMoments, emotionalSummary } =
    journeyData;

  // Prepare chart data
  const chartData = journey.map((entry) => ({
    ...entry,
    date: new Date(entry.date).getTime(),
    displayDate: new Date(entry.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="emotional-journey-container">
      <div className="emotional-journey-header">
        <h2>Your Emotional Journey</h2>
        <p className="journey-subtitle">
          Tracking the feelings and moments that shape your progress
        </p>
      </div>

      {/* Mood Trend Summary */}
      {moodTrend && (
        <div className={`mood-trend-card trend-${moodTrend.direction}`}>
          <div className="trend-icon">
            {moodTrend.direction === 'improving'
              ? '📈'
              : moodTrend.direction === 'declining'
              ? '📉'
              : '➡️'}
          </div>
          <div className="trend-content">
            <h3>{moodTrend.message}</h3>
            <p className="trend-details">
              Your emotional energy has{' '}
              {moodTrend.direction === 'improving'
                ? 'risen'
                : moodTrend.direction === 'declining'
                ? 'dipped'
                : 'remained steady'}{' '}
              over time (
              {moodTrend.earlyAverage.toFixed(1)} →{' '}
              {moodTrend.recentAverage.toFixed(1)})
            </p>
          </div>
        </div>
      )}

      {/* Main Chart */}
      <div className="journey-chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A8E6CF" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FFB6B9" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12, fill: '#888' }}
              stroke="#e0e0e0"
            />
            <YAxis
              domain={[0, 10]}
              ticks={[2, 4, 6, 8, 10]}
              tick={{ fontSize: 12, fill: '#888' }}
              stroke="#e0e0e0"
              label={{
                value: 'Emotional State',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: '#888' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="moodValue"
              stroke="#6c5ce7"
              strokeWidth={3}
              fill="url(#moodGradient)"
              onClick={(e) => handlePointClick(e)}
            />
            {/* Highlight significant moments */}
            {chartData
              .filter((entry) => entry.isMilestone)
              .map((entry, index) => (
                <ReferenceDot
                  key={index}
                  x={entry.displayDate}
                  y={entry.moodValue}
                  r={8}
                  fill="#FFD93D"
                  stroke="#FF6B9D"
                  strokeWidth={2}
                />
              ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Significant Moments */}
      {significantMoments && significantMoments.length > 0 && (
        <div className="significant-moments-section">
          <h3>✨ Significant Moments</h3>
          <div className="moments-grid">
            {significantMoments.map((moment, index) => (
              <div key={index} className="moment-card">
                <div className="moment-emoji">{moment.emoji}</div>
                <div className="moment-content">
                  <p className="moment-date">
                    {new Date(moment.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <h4>{moment.title}</h4>
                  {moment.notes && (
                    <p className="moment-notes">
                      "{moment.notes.slice(0, 150)}
                      {moment.notes.length > 150 ? '...' : ''}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emotional Summary */}
      {emotionalSummary && (
        <div className="emotional-summary-section">
          <h3>Your Emotional Landscape</h3>
          <div className="summary-stats">
            <div className="summary-stat">
              <div className="stat-icon">
                {emotionalSummary.dominantMoodEmoji}
              </div>
              <div className="stat-content">
                <p className="stat-label">Most Common Feeling</p>
                <p className="stat-value">
                  {emotionalSummary.dominantMood} (
                  {emotionalSummary.dominantMoodPercentage}%)
                </p>
              </div>
            </div>
            <div className="summary-stat">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <p className="stat-label">Total Reflections</p>
                <p className="stat-value">{emotionalSummary.totalEntries}</p>
              </div>
            </div>
            <div className="summary-stat">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <p className="stat-label">Milestones Celebrated</p>
                <p className="stat-value">
                  {emotionalSummary.milestonesCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Point Details */}
      {selectedPoint && (
        <div className="selected-point-modal" onClick={() => setSelectedPoint(null)}>
          <div
            className="selected-point-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedPoint(null)}
            >
              ×
            </button>
            <h3>{selectedPoint.title}</h3>
            <p className="modal-date">
              {new Date(selectedPoint.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            {selectedPoint.description && (
              <p className="modal-description">{selectedPoint.description}</p>
            )}
            {selectedPoint.notes && (
              <div className="modal-notes">
                <h4>Your Reflections</h4>
                <p>{selectedPoint.notes}</p>
              </div>
            )}
            <div className="modal-tags">
              {selectedPoint.tags &&
                selectedPoint.tags.map((tag, index) => (
                  <span key={index} className="modal-tag">
                    #{tag}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionalJourneyMap;
