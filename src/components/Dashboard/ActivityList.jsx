import React from 'react'

const ActivityList = ({ title, items, renderItem }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm h-full">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      
      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Aucun élément à afficher</p>
      ) : (
        <ul className="divide-y">
          {items.map((item, index) => (
            <li key={index} className="py-3">
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ActivityList
