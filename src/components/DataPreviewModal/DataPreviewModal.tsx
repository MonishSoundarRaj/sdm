import React, { useState, useEffect } from 'react';
import { Modal, TextInput, Group, Button, Pagination } from '@mantine/core';
import { useTable, usePagination, useSortBy, useResizeColumns, useBlockLayout } from 'react-table';
import axios from 'axios';
import Papa from 'papaparse';
import { FaSearch } from 'react-icons/fa';
import { BiSortAlt2, BiSortUp, BiSortDown } from 'react-icons/bi';
import classes from './DataPreviewModal.module.css';

export function DataPreviewModal({ isOpen, onClose, dataSource }) {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(dataSource);
        Papa.parse(response.data, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              setData(results.data);
              setColumns(
                Object.keys(results.data[0]).map((col) => ({
                  Header: col,
                  accessor: col,
                  minWidth: 100,
                  width: 150,
                }))
              );
            } else {
              setError('No data found in the CSV file');
            }
          },
          error: (error) => {
            setError('Failed to parse CSV data');
          },
        });
      } catch (error) {
        setError(`Failed to fetch CSV file: ${error.message}`);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, dataSource]);

  const filteredData = React.useMemo(() => {
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [data, search]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    pageCount,
    gotoPage,
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data: filteredData,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useResizeColumns,
    useBlockLayout,
    useSortBy,
    usePagination
  );

  return (
    <Modal 
      opened={isOpen} 
      onClose={onClose} 
      size="90%" 
      padding="lg"
      title={dataSource}
      classNames={{ modal: classes.dataModalContainer }}
    >
      <div className={classes.dataModalContent}>
        <Group position="apart" p="md">
          <TextInput
            placeholder="Search..."
            icon={<FaSearch />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ flex: 1 }}
            classNames={{ input: classes.mantineTextInputInput }}
          />
        </Group>

        <div className={classes.tableContainer}>
          <div {...getTableProps()} className={classes.dataTable}>
            <div>
              {headerGroups.map((headerGroup) => (
                <div {...headerGroup.getHeaderGroupProps()} className={classes.tableHeader}>
                  {headerGroup.headers.map((column) => (
                    <div {...column.getHeaderProps(column.getSortByToggleProps())} className={classes.tableHeaderCell}>
                      {column.render('Header')}
                      <span>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? <BiSortDown />
                            : <BiSortUp />
                          : <BiSortAlt2 />}
                      </span>
                      <div
                        {...column.getResizerProps()}
                        className={`${classes.resizer} ${column.isResizing ? classes.isResizing : ''}`}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div {...getTableBodyProps()}>
              {page.map((row) => {
                prepareRow(row);
                return (
                  <div {...row.getRowProps()} className={classes.tableRow}>
                    {row.cells.map((cell) => (
                      <div {...cell.getCellProps()} className={classes.tableCell}>{cell.render('Cell')}</div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <Group position="center" className={classes.mantinePaginationContainer}>
          <Pagination
            total={pageCount}
            page={pageIndex + 1}
            onChange={(page) => gotoPage(page - 1)}
            classNames={{ item: classes.mantinePaginationItem, itemActive: classes.mantinePaginationItemActive }}
          />
        </Group>
      </div>
    </Modal>
  );
}