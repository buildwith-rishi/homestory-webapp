import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useInstagramStore } from '../../stores/instagramStore';
import { InstagramPostType, InstagramPostStatus } from '../../types';

export function ContentCalendar() {
  const { posts, fetchPosts, calendarView, selectedDate, setCalendarView, setSelectedDate } =
    useInstagramStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const getPostsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return posts.filter((post) => {
      const postDate = post.scheduledDate || post.publishedDate;
      return postDate?.split('T')[0] === dateStr;
    });
  };

  const getPostTypeColor = (type: InstagramPostType) => {
    switch (type) {
      case InstagramPostType.REEL:
        return 'bg-orange-500';
      case InstagramPostType.CAROUSEL:
        return 'bg-teal-600';
      case InstagramPostType.STORY:
        return 'bg-rose-400';
      case InstagramPostType.SINGLE:
        return 'bg-green-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getPostTypeLabel = (type: InstagramPostType) => {
    switch (type) {
      case InstagramPostType.REEL:
        return 'R';
      case InstagramPostType.CAROUSEL:
        return 'C';
      case InstagramPostType.STORY:
        return 'S';
      case InstagramPostType.SINGLE:
        return 'I';
      default:
        return '?';
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <h2 className="text-xl font-bold text-gray-900">{monthName}</h2>

          <button
            onClick={handleNextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={handleToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCalendarView('month')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                calendarView === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setCalendarView('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                calendarView === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
          </div>

          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Post
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-xs font-semibold text-gray-600 bg-gray-50"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((date, index) => {
            const postsForDay = getPostsForDate(date);
            const isCurrentDay = isToday(date);

            return (
              <div
                key={index}
                className={`min-h-[120px] border-b border-r border-gray-200 p-2 ${
                  !date ? 'bg-gray-50' : 'bg-white hover:bg-gray-50 cursor-pointer'
                } ${index % 7 === 6 ? 'border-r-0' : ''}`}
                onClick={() => date && setSelectedDate(date)}
              >
                {date && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-medium ${
                          isCurrentDay
                            ? 'w-6 h-6 flex items-center justify-center rounded-full bg-orange-500 text-white'
                            : 'text-gray-900'
                        }`}
                      >
                        {date.getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {postsForDay.slice(0, 3).map((post) => {
                        const time = new Date(
                          post.scheduledDate || post.publishedDate || ''
                        ).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        });

                        return (
                          <div
                            key={post.id}
                            className={`px-2 py-1 rounded text-xs font-medium text-white ${getPostTypeColor(
                              post.type
                            )} flex items-center gap-1.5`}
                          >
                            <span>{getPostTypeLabel(post.type)}</span>
                            <span className="truncate flex-1">{time}</span>
                          </div>
                        );
                      })}

                      {postsForDay.length > 3 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{postsForDay.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium text-gray-700">Legend:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span className="text-gray-600">Reel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-teal-600"></div>
          <span className="text-gray-600">Carousel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-rose-400"></div>
          <span className="text-gray-600">Story</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-600"></div>
          <span className="text-gray-600">Single Image</span>
        </div>
      </div>
    </div>
  );
}
