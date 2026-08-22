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
    <div className="w-full overflow-x-auto rounded-[1rem] border border-border shadow-lg bg-card backdrop-blur-md">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="bg-muted/50 border-b border-border text-foreground">
          <tr>
            {columns.map((col, index) => (
              <th 
                key={index} 
                scope="col" 
                className="px-6 py-4 font-bold tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className="px-6 py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="hover:bg-muted/30 transition-colors"
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
                      className="px-6 py-4 text-foreground/90 font-medium"
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
