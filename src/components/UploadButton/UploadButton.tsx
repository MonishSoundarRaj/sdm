import React, { useState, useRef } from 'react';
import { Button, Group, Loader, Text, Box } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import classes from './DashboardLayout.module.css';

export function UploadButton({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploading(true);
      setSuccess(false);
      setError('');
  
      const formData = new FormData();
      formData.append('file', file);
  
      try {
        const response = await fetch('http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
  
        const result = await response.json();

        if (response.status === 409) {
          setError('File already exists');
        } else if (!response.ok) {
          throw new Error(result.message || 'File upload failed');
        } else {
          console.log('File uploaded successfully:', result);
          setSuccess(true);
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setError(error.message);
      } finally {
        setUploading(false);
        setTimeout(() => {
          setSuccess(false);
          setError('');
        }, 3000);
      }
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {!uploading && !success && !error && (
        <Button fullWidth size="md" color="black" onClick={handleUploadClick}>
          <Group spacing="xs">
            <IconUpload size={20} />
            <span>Upload Data</span>
          </Group>
        </Button>
      )}
      {uploading && (
        <Button fullWidth size="md" color="black" disabled>
          <Group spacing="xs">
            <Loader size="sm" />
            <span>Uploading...</span>
          </Group>
        </Button>
      )}
      {success && (
        <Button fullWidth size="md" color="green" disabled>
          <Text size="sm">File Uploaded Successfully!</Text>
        </Button>
      )}
      {error && (
        <Button fullWidth size="md" color="red" disabled>
          <Text size="sm">{error}</Text>
        </Button>
      )}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </Box>
  );
}