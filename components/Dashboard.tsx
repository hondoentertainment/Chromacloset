
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { WardrobeItem } from '../types';

interface DashboardProps {
  items: WardrobeItem[];
}

export const Dashboard: React.FC<DashboardProps> = ({ items }) => {
  const stats = useMemo(() => {
    const total = items.length;
    const colors = Array.from(new Set(items.map(i => i.dominantColorHex))).length;
    const families = Array.from(new Set(items.map(i => i.colorFamily))).length;
    
    const familyCounts = items.reduce((acc, item) => {
      acc[item.colorFamily] = (acc[item.colorFamily] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryCounts = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonColor = items.length > 0 
      ? items.reduce((a, b, i, arr) => 
          (arr.filter(v => v.colorName === a.colorName).length >= arr.filter(v => v.colorName === b.colorName).length ? a : b)
        ).colorName
      : 'N/A';

    return { 
      total, colors, families, 
      mostCommonColor,
      familyData: Object.entries(familyCounts).map(([name, value]) => ({ name, value })),
      categoryData: Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">No items found. Start by scanning your closet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: stats.total, icon: '👕' },
          { label: 'Unique Colors', value: stats.colors, icon: '🎨' },
          { label: 'Color Families', value: stats.families, icon: '🌈' },
          { label: 'Top Shade', value: stats.mostCommonColor, icon: '✨' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-sm font-medium text-slate-500 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Inventory by Family</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.familyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Inventory by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {stats.categoryData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'][index % 5] }}></div>
                <span className="text-xs font-medium text-slate-600 capitalize">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Wardrobe Color Spectrum</h3>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div 
              key={item.id}
              className="group relative w-12 h-12 rounded-lg border border-slate-200 transition-transform hover:scale-110 cursor-pointer"
              style={{ backgroundColor: item.dominantColorHex }}
              title={`${item.colorName} ${item.subcategory}`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/20 rounded-lg flex items-center justify-center pointer-events-none">
                <span className="text-[8px] text-white font-bold">{item.dominantColorHex}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
