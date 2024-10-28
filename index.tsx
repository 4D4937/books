import { useState } from 'react';
import Papa from 'papaparse';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  Paper,
  TableContainer,
  TablePagination
} from '@mui/material';

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const rowsPerPage = 30;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          setHeaders(results.data[0] as string[]);
          setData(results.data.slice(1) as any[]);
        },
        header: false
      });
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  return (
    <div style={{ padding: '20px' }}>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ marginBottom: '20px' }}
      />
      
      {data.length > 0 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableCell key={index}>{header}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell: any, cellIndex: number) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={data.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[30]}
          />
        </Paper>
      )}
    </div>
  );
}
