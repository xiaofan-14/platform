'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Alert,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface JobData {
  deviceId: string;
  type: string;
  payload?: string;
}

interface JobResult {
  jobId?: string;
  deviceId?: string;
  type?: string;
  status?: string;
  message?: string;
  error?: string;
}

export default function JobPage() {
  const [formData, setFormData] = useState<JobData>({
    deviceId: '',
    type: 'device-sync',
    payload: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 解析 payload（如果是 JSON 字符串）
      let parsedPayload: any = {};
      if (formData.payload?.trim()) {
        try {
          parsedPayload = JSON.parse(formData.payload);
        } catch (e) {
          throw new Error('payload 必须是有效的 JSON 格式');
        }
      }

      const response = await fetch('/api/job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: formData.deviceId,
          type: formData.type,
          payload: parsedPayload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '创建任务失败');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/job?jobId=${jobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取任务状态失败');
      }

      setResult({
        ...result,
        ...data.data,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务状态失败');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        任务测试
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        创建 BullMQ 任务并查看任务状态
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="设备ID"
              value={formData.deviceId}
              onChange={(e) =>
                setFormData({ ...formData, deviceId: e.target.value })
              }
              required
              placeholder="例如: 1"
            />

            <TextField
              label="任务类型"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              required
              select
              SelectProps={{ native: true }}
            >
              <option value="device-sync">设备同步 (device-sync)</option>
              <option value="device-command">设备命令 (device-command)</option>
              <option value="device-status-check">
                设备状态检查 (device-status-check)
              </option>
            </TextField>

            <TextField
              label="Payload (JSON)"
              value={formData.payload}
              onChange={(e) =>
                setFormData({ ...formData, payload: e.target.value })
              }
              multiline
              rows={4}
              placeholder='例如: {"action": "update", "data": {"key": "value"}}'
              helperText="可选，必须是有效的 JSON 格式"
            />

            <Button
              type="submit"
              variant="contained"
              startIcon={<SendIcon />}
              disabled={loading || !formData.deviceId || !formData.type}
              sx={{ alignSelf: 'flex-start' }}
            >
              {loading ? '创建中...' : '创建任务'}
            </Button>
          </Box>
        </form>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              任务信息
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {result.jobId && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    任务ID:
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {result.jobId}
                  </Typography>
                </Box>
              )}
              {result.deviceId && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    设备ID:
                  </Typography>
                  <Typography variant="body1">{result.deviceId}</Typography>
                </Box>
              )}
              {result.type && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    任务类型:
                  </Typography>
                  <Typography variant="body1">{result.type}</Typography>
                </Box>
              )}
              {result.status && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    状态:
                  </Typography>
                  <Typography variant="body1">{result.status}</Typography>
                </Box>
              )}
              {result.message && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {result.message}
                </Alert>
              )}
            </Box>
            {result.jobId && (
              <Button
                variant="outlined"
                onClick={() => handleCheckStatus(result.jobId!)}
                sx={{ mt: 2 }}
              >
                刷新任务状态
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
