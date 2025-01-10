import { Container, Title, Text, List, Anchor, Paper } from '@mantine/core';
import classes from './TermsLayout.module.css';

export function Terms() {
  return (
    <Container size="md" className={classes.container}>
      <Paper radius="md" p="xl" withBorder>
        <Title order={1} className={classes.title} align="center" mb="lg">
          Terms and Conditions
        </Title>
        <Text size="sm" className={classes.date} mb="md" align="center">
          Last updated: July 31, 2024
        </Text>

        <section className={classes.section}>
          <Title order={2} className={classes.subtitle}>
            1. Introduction
          </Title>
          <Text>
            Welcome to GenDM! These terms and conditions outline the rules and regulations for the use of GenDM's application and services.
          </Text>
        </section>

        <section className={classes.section}>
          <Title order={2} className={classes.subtitle}>
            2. Acceptance of Terms
          </Title>
          <Text>
            By accessing and using our services, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
          </Text>
        </section>

        <section className={classes.section}>
          <Title order={2} className={classes.subtitle}>
            3. Changes to Terms
          </Title>
          <Text>
            GenDM reserves the right to update the terms and conditions at any time. Any changes will be posted on this page, and it is your responsibility to review these terms regularly.
          </Text>
        </section>

        <section className={classes.section}>
          <Title order={2} className={classes.subtitle}>
            4. User Accounts
          </Title>
          <Text>
            When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
          </Text>
        </section>

        <section className={classes.section}>
          <Title order={2} className={classes.subtitle}>
            5. Privacy Policy
          </Title>
          <Text>
            Your privacy is important to us. Please read our <Anchor href="/privacy-policy">Privacy Policy</Anchor> carefully for information on how we collect, use, and disclose your personal information.
          </Text>
        </section>

        <section className={classes.section}>
          <Title order={2} className={classes.subtitle}>
            6. Limitation of Liability
          </Title>
          <Text>
            GenDM will not be liable for any damages or losses arising from your use of our services or from any information, content, or other materials on our application.
          </Text>
        </section>

        <section className={classes.section}>
          <Title order={2} className={classes.subtitle}>
            7. Governing Law
          </Title>
          <Text>
            These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which GenDM operates, without regard to its conflict of law provisions.
          </Text>
        </section>

        <section className={classes.section}>
          <Title order={2} className={classes.subtitle}>
            8. Contact Us
          </Title>
          <Text>
            If you have any questions about these Terms, please contact us at <Anchor href="mailto:support@gendm.com">support@gendm.com</Anchor>.
          </Text>
        </section>
      </Paper>
    </Container>
  );
}
