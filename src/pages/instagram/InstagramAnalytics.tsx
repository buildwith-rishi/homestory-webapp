import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Users, Eye, MousePointer, Heart, MessageCircle } from 'lucide-react';
import { useInstagramStore } from '../../stores/instagramStore';

export function InstagramAnalytics() {
  const { analytics, fetchAnalytics } = useInstagramStore();
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Followers',
      value: analytics.followers.total.toLocaleString(),
      change: analytics.followers.change,
      changePercent: analytics.followers.changePercent,
      icon: Users,
    },
    {
      label: 'Engagement Rate',
      value: `${analytics.engagement.rate}%`,
      change: analytics.engagement.change,
      changePercent: (analytics.engagement.change / analytics.engagement.rate) * 100,
      icon: Heart,
    },
    {
      label: 'Reach',
      value: analytics.reach.total.toLocaleString(),
      change: analytics.reach.change,
      changePercent: (analytics.reach.change / analytics.reach.total) * 100,
      icon: Eye,
    },
    {
      label: 'Profile Visits',
      value: analytics.profileVisits.total.toLocaleString(),
      change: analytics.profileVisits.change,
      changePercent: (analytics.profileVisits.change / analytics.profileVisits.total) * 100,
      icon: MousePointer,
    },
  ];

  const getActiveHoursColor = (value: number) => {
    if (value > 75) return 'bg-orange-500';
    if (value > 50) return 'bg-orange-400';
    if (value > 25) return 'bg-orange-300';
    return 'bg-orange-100';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Instagram Analytics</h1>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.change >= 0;

          return (
            <div
              key={stat.label}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-orange-600" />
                </div>
                {isPositive ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>

              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>

              <div className="flex items-center gap-1 text-sm">
                <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                  {isPositive ? '+' : ''}
                  {stat.change.toLocaleString()} ({stat.changePercent.toFixed(1)}%)
                </span>
                <span className="text-gray-500">vs previous period</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Posts</h2>

          <div className="space-y-4">
            {analytics.topPosts.map((post) => (
              <div key={post.id} className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {post.media[0] && (
                    <img
                      src={post.media[0].url}
                      alt={post.media[0].altText}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium truncate">
                    {post.caption.split('\n')[0]}
                  </p>
                  {post.metrics && (
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {post.metrics.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {post.metrics.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.metrics.reach}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Audience Demographics</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Age Range</h3>
              <div className="space-y-2">
                {analytics.audienceDemographics.ageRanges.map((range) => (
                  <div key={range.range} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-16">{range.range}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${range.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {range.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Top Locations</h3>
              <div className="space-y-2">
                {analytics.audienceDemographics.topLocations.map((location) => (
                  <div key={location.city} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">{location.city}</span>
                    <span className="text-sm font-medium text-orange-600">
                      {location.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Audience Active Hours
        </h2>

        <div className="overflow-x-auto">
          <div className="inline-grid grid-cols-25 gap-1 min-w-full">
            <div className="col-span-1"></div>
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="text-center">
                <span className="text-xs text-gray-600">
                  {i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`}
                </span>
              </div>
            ))}

            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => (
              <>
                <div key={day} className="flex items-center justify-end pr-2">
                  <span className="text-xs font-medium text-gray-600">{day}</span>
                </div>
                {analytics.activeHours[dayIndex].map((value, hourIndex) => (
                  <div
                    key={`${day}-${hourIndex}`}
                    className={`w-8 h-8 rounded ${getActiveHoursColor(value)}`}
                    title={`${day} ${hourIndex}:00 - ${value}% active`}
                  ></div>
                ))}
              </>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600">
          <span>Less active</span>
          <div className="w-4 h-4 rounded bg-orange-100"></div>
          <div className="w-4 h-4 rounded bg-orange-300"></div>
          <div className="w-4 h-4 rounded bg-orange-400"></div>
          <div className="w-4 h-4 rounded bg-orange-500"></div>
          <span>More active</span>
        </div>
      </div>
    </div>
  );
}
