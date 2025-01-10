import React, { useState } from 'react';
import { useToggle, upperFirst } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import {
  TextInput,
  PasswordInput,
  Text,
  Paper,
  Group,
  Button,
  Divider,
  Checkbox,
  Anchor,
  Stack,
  Container,
  Loader,  // Add Loader component from Mantine
} from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import classes from './AuthenticationForm.module.css';

export function AuthenticationForm(props) {
  const [type, toggle] = useToggle(['login', 'register']);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);  // Add loading state

  const form = useForm({
    initialValues: {
      email: '',
      name: '',
      password: '',
      terms: true,
    },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
      password: (val) => (val.length <= 6 ? 'Password should include at least 6 characters' : null),
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);  // Set loading to true
    const endpoint = type === 'login' ? 'login' : 'register';
    const response = await fetch(`http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: values.email,
        username: values.name, 
        password: values.password,
      }),
      credentials: 'include',
    });

    setLoading(false);  

    if (response.ok) {
      navigate('/');
    } else {
      const errorData = await response.json();
      console.error(`${upperFirst(type)} error:`, errorData);
    }
  };

  return (
    <div className={classes.wrapper}>
      <Container size="xs" className={classes.container}>
        <Paper radius="md" p="xl" withBorder {...props} className={classes.form}>
          <div className={classes.header}>
            <Text size="xl" fw={700} className={classes.gradientText}>
              Welcome to GenDM
            </Text>
            <Text size="lg" fw={500} className={classes.subtitle}>
              {upperFirst(type)} with
            </Text>
          </div>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              {type === 'register' && (
                <TextInput
                  label="Name"
                  placeholder="Your name"
                  value={form.values.name}
                  onChange={(event) => form.setFieldValue('name', event.currentTarget.value)}
                  radius="md"
                />
              )}

              <TextInput
                required
                label="Email"
                placeholder="hello@gmail.com"
                value={form.values.email}
                onChange={(event) => form.setFieldValue('email', event.currentTarget.value)}
                error={form.errors.email && 'Invalid email'}
                radius="md"
              />

              <PasswordInput
                required
                label="Password"
                placeholder="Your password"
                value={form.values.password}
                onChange={(event) => form.setFieldValue('password', event.currentTarget.value)}
                error={form.errors.password && 'Password should include at least 6 characters'}
                radius="md"
              />

              {type === 'register' && (
                <Checkbox
                  label={
                    <>
                      I accept the <Link to="/terms" className={classes.link}>terms and conditions</Link>
                    </>
                  }
                  checked={form.values.terms}
                  onChange={(event) => form.setFieldValue('terms', event.currentTarget.checked)}
                />
              )}
            </Stack>

            <Group justify="space-between" mt="xl">
              <Anchor component="button" type="button" c="dimmed" onClick={() => toggle()} size="xs">
                {type === 'register'
                  ? 'Already have an account? Login'
                  : "Don't have an account? Register"}
              </Anchor>
              
              <Button type="submit" radius="xl" disabled={loading}>  {/* Disable button when loading */}
                {loading ? <Loader size="xs" /> : upperFirst(type)} {/* Show loader when loading */}
              </Button>
            </Group>
          </form>
        </Paper>
      </Container>
    </div>
  );
}
