import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Section,
  Hr,
} from '@react-email/components'

interface ShareInviteEmailProps {
  ownerEmail: string
  acceptUrl: string
}

export function ShareInviteEmail({ ownerEmail, acceptUrl }: ShareInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', margin: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '40px auto', padding: '0 16px' }}>
          {/* Header */}
          <Section
            style={{
              backgroundColor: '#0f172a',
              borderRadius: '16px 16px 0 0',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              ZenGarantie
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>
              Invitation au partage
            </Text>
          </Section>

          {/* Body */}
          <Section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0 0 16px 16px',
              padding: '28px 24px',
              border: '1px solid #e2e8f0',
              borderTop: 'none',
            }}
          >
            <Text style={{ color: '#0f172a', fontSize: '15px', margin: '0 0 8px' }}>
              Bonjour,
            </Text>
            <Text style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
              <strong>{ownerEmail}</strong> vous invite à consulter ses garanties sur ZenGarantie.
              Vous aurez accès en lecture seule à toutes ses factures et garanties.
            </Text>

            <Section
              style={{
                backgroundColor: '#f0fdf4',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '24px',
                borderLeft: '4px solid #22c55e',
              }}
            >
              <Text style={{ color: '#15803d', fontSize: '13px', margin: 0 }}>
                Ce lien est personnel et ne peut être utilisé qu&apos;une seule fois.
                Si vous n&apos;avez pas encore de compte ZenGarantie, vous devrez en créer un.
              </Text>
            </Section>

            <Hr style={{ borderColor: '#e2e8f0', margin: '0 0 24px' }} />

            <Button
              href={acceptUrl}
              style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Accepter l&apos;invitation →
            </Button>

            <Text style={{ color: '#94a3b8', fontSize: '12px', marginTop: '24px', marginBottom: 0 }}>
              Si vous ne connaissez pas {ownerEmail} ou n&apos;attendiez pas cette invitation,
              ignorez simplement cet email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
