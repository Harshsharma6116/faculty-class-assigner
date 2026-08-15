import React from 'react';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  // Fallback for custom rendering
  cell?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  emptyMessage = 'No data available' 
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
          <tr>
            {columns.map((col, index) => (
              <th 
                key={index} 
                scope="col" 
                className="px-6 py-3 font-semibold tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className="px-6 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="hover:bg-gray-50 transition-colors"
              >
                {columns.map((col, colIndex) => {
                  let cellContent: React.ReactNode;
                  if (col.cell) {
                    cellContent = col.cell(row);
                  } else if (col.accessorKey) {
                    cellContent = row[col.accessorKey] as React.ReactNode;
                  }

                  return (
                    <td 
                      key={colIndex} 
                      className="px-6 py-4 text-gray-900"
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
