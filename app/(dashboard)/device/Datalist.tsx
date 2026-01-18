"use client"

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

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
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  // 使用 Map 存储每个设备的定时器，避免内存泄漏
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
      // 注册后重新请求刷新列表
      // 为新设备启动轮询
    //   startPolling(newDevice.id);

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

  // 获取单个设备状态
  const getDeviceStatus = useCallback(async (deviceId: string) => {
    try {
      const response = await fetch(`/api/device/${deviceId}`);
      const data = await response.json();
      
      if (data.data) {
        // 更新设备状态
        setDevices((prevDevices) => {
          if (!prevDevices) return prevDevices;
          return prevDevices.map((device) =>
            device.id === deviceId.toString()
              ? {
                  ...device,
                  cpuUsage: data.data.cpuUsage,
                  status: data.data.status,
                }
              : device
          );
        });
      }
    } catch (err) {
      console.error('获取设备状态失败:', err);
    }
  }, []);

  // 启动设备状态轮询
  const startPolling = useCallback((deviceId: string) => {
    // 首先检查是否有定时器，如果有，清除定时器
    timersRef.current.get(deviceId) && clearTimeout(timersRef.current.get(deviceId));
    // 如果没有创建一个闭包函数，在闭包中定时请求
    const poll = async () => {
        // 立即执行一次 获取状态
        await getDeviceStatus(deviceId);
        // 设置下一次轮询
        const timer = setTimeout(() => {
            poll();
        }, 5000);
        timersRef.current.set(deviceId, timer);
    }
    // 立即执行一次
    poll();
  }, [getDeviceStatus]);

  // 停止设备状态轮询
  const stopPolling = useCallback((deviceId: string) => {
    const timer = timersRef.current.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(deviceId);
    }
  }, []);

  // 停止所有轮询
  const stopAllPolling = useCallback(() => {
    timersRef.current.forEach((timer) => {
      clearTimeout(timer);
    });
    timersRef.current.clear();
  }, []);

  // 获取设备列表
  const getDevices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/device');
      const data = await response.json();
      const deviceList = data.data || [];
      setDevices(deviceList);
      
      // 为每个设备启动轮询
      deviceList.forEach((device: Device) => {
        startPolling(device.id.toString());
      });
    } catch (err) {
      console.error('获取设备列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [startPolling]);

  const handleOpenDownloadDialog = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setOpenDownloadDialog(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseDownloadDialog = () => {
    setOpenDownloadDialog(false);
    setSelectedDeviceId(null);
    setError(null);
    setSuccess(null);
  };

  // 组件挂载时获取设备列表
  useEffect(() => {
    getDevices();

    // 组件卸载时清理所有定时器
    return () => {
      stopAllPolling();
    };
  }, [getDevices, stopAllPolling]);

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
                    <Box sx={{display: 'flex', gap: 1, justifyContent: 'flex-end'}}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDownloadDialog(device.id)}
                        color="primary"
                        title="安装Agent"
                      >
                        <DownloadIcon fontSize="small"/>
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(device.id)}
                        color="primary"
                        title="编辑设备"
                      >
                        <EditIcon fontSize="small"/>
                      </IconButton>
                    </Box>
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

      <Dialog open={openDownloadDialog} onClose={handleCloseDownloadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          安装Agent
          {selectedDeviceId && (
            <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
              设备ID: {selectedDeviceId}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{pt: 2}}>
            {/* 通过 location 获取 当前域名，显示一个复制 按钮，
            前面使用 <code> 显示一个代码块 显示 当前域名/agent/install.sh */}
            {success && (
              <Alert severity="success" sx={{mb: 2}} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
              <Box
                component="code"
                sx={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  backgroundColor: '#000',
                  color: '#fff',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  flexGrow: 1,
                  overflow: 'auto',
                }}
              >
                {typeof window !== 'undefined' && selectedDeviceId && `AGENT_SERVER_URL=${window.location.origin} AGENT_DEVICE_ID=${selectedDeviceId} bash -c "$(curl -sSL ${window.location.origin}/agent/install.sh)"`}
              </Box>
              <IconButton
                size="small"
                color="primary"
                onClick={async () => {
                  if (typeof window !== 'undefined' && selectedDeviceId) {
                    const command = `AGENT_SERVER_URL=${window.location.origin} AGENT_DEVICE_ID=${selectedDeviceId} bash -c "$(curl -sSL ${window.location.origin}/agent/install.sh)"`;
                    try {
                      await navigator.clipboard.writeText(command);
                      // 复制成功提示
                      setSuccess('已复制到剪贴板');
                      setTimeout(() => setSuccess(null), 2000);
                    } catch (err) {
                      console.error('复制失败:', err);
                      setError('复制失败，请手动复制');
                    }
                  }
                }}
                disabled={!selectedDeviceId}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
