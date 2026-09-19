'use client'
export default function Stamps() {
  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🎫 我的铁路集章</h1>
      <p className="text-gray-600 mb-6">完成打卡即可获得专属印章</p >

      <div className="flex flex-wrap gap-4 justify-center">
        {/* 复古火车票印章 */}
        <div className="w-40 h-60 border-4 border-dashed border-red-400 rounded-lg flex flex-col items-center justify-center bg-orange-50 rotate-3 shadow-lg">
          <div className="text-red-500 text-5xl mb-2">🚂</div>
          <div className="font-bold text-lg text-gray-800">成都站</div>
          <div className="text-xs text-gray-500 mt-1">2026.09.19</div>
          <div className="mt-3 px-2 py-1 border-2 border-red-500 text-red-500 rounded transform -rotate-12 font-bold">
            已集章
          </div>
        </div>

        {/* 再来一个样式 */}
        <div className="w-40 h-60 border-4 border-dashed border-blue-400 rounded-lg flex flex-col items-center justify-center bg-blue-50 -rotate-3 shadow-lg">
          <div className="text-blue-500 text-5xl mb-2">🏅</div>
          <div className="font-bold text-lg text-gray-800">重庆站</div>
          <div className="text-xs text-gray-500 mt-1">2026.09.20</div>
          <div className="mt-3 px-2 py-1 border-2 border-blue-500 text-blue-500 rounded transform rotate-12 font-bold">
            已集章
          </div>
        </div>
      </div>
      
      <a href=" " className="block text-center mt-8 text-blue-500">⬅ 返回首页</a >
    </main>
  )
}