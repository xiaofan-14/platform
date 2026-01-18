"use client"

import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

// 设备数据类型
interface Device {
  id: string;
  name: string;
  cpuUsage: number;
  status: 'online' | 'offline';
}

export default function Datalist() {
  const [searchQuery, setSearchQuery] = useState('');
  const [devices, setDevices] = useState<Device[]>();
  const [openDialog, setOpenDialog] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 过滤设备列表
  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) {
      return devices;
    }
    return devices?.filter((device) =>
      device.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [devices, searchQuery]);

  const handleEdit = (deviceId: string) => {
    console.log('编辑设备:', deviceId);
    // TODO: 实现编辑功能
  };

  const handleAdd = () => {
    setOpenDialog(true);
    setDeviceName('');
    setError(null);
    setSuccess(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDeviceName('');
    setError(null);
    setSuccess(null);
  };

  const handleRegister = async () => {
    if (!deviceName.trim()) {
      setError('设备名称不能为空');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({name: deviceName.trim()}),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || '注册失败');
        return;
      }

      setSuccess('设备注册成功');
      // 将新设备添加到列表（转换为前端格式）
      const newDevice: Device = {
        id: data.data.id.toString(),
        name: data.data.name,
        cpuUsage: data.data.cpuUsage,
        status: data.data.status,
      };
      setDevices([...(devices || []), newDevice]);

      // 2秒后关闭对话框
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getDevices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/device');
      const data = await response.json();
      setDevices(data.data);
    } catch (err) {
      console.error('获取设备列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getDevices();
  }, [getDevices]);

  return (
    <Box>
      {/* 搜索框和添加按钮 */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2,
        }}
      >
        <TextField
          placeholder="搜索设备名称"
          value={searchQuery}
          size="small"
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{flexGrow: 1, maxWidth: 400}}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon/>
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{
          display: 'flex',
          gap: 2,
        }}>
          <Button
            variant="contained"
            startIcon={<AddIcon/>}
            onClick={handleAdd}
            size='small'
          >
            注册设备
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon/>}
            onClick={handleAdd}
            size='small'
          >
            安装Agent
          </Button>
        </Box>
      </Box>

      {!filteredDevices && (
        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
          没有找到数据
        </Box>
      )}

      {/* 设备列表表格 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  设备名称
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  CPU 占用率
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  状态
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight="bold">
                  操作
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDevices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="text.secondary">
                    没有找到设备
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredDevices?.map((device) => (
                <TableRow key={device.id} hover>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1, minWidth: 200}}>
                      <LinearProgress
                        variant="determinate"
                        value={device.cpuUsage}
                        sx={{
                          flexGrow: 1,
                          height: 8,
                          borderRadius: 1,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor:
                              device.cpuUsage > 80
                                ? 'error.main'
                                : device.cpuUsage > 50
                                  ? 'warning.main'
                                  : 'success.main',
                          },
                        }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{minWidth: 40}}>
                        {device.cpuUsage}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={device.status === 'online' ? '在线' : '离线'}
                      color={device.status === 'online' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(device.id)}
                      color="primary"
                    >
                      <EditIcon/>
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 注册设备对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>注册新设备</DialogTitle>
        <DialogContent>
          <Box sx={{pt: 2}}>
            {error && (
              <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{mb: 2}}>
                {success}
              </Alert>
            )}
            <TextField
              autoFocus
              margin="dense"
              label="设备名称"
              fullWidth
              variant="outlined"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleRegister();
                }
              }}
              helperText="请输入设备的唯一名称"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            取消
          </Button>
          <Button
            onClick={handleRegister}
            variant="contained"
            disabled={loading || !deviceName.trim()}
          >
            {loading ? '注册中...' : '注册'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
