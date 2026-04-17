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

interface WarrantyItem {
  title: string
  expiryDate: string
  daysLeft: number
}

interface WarrantyReminderEmailProps {
  email: string
  warranties: WarrantyItem[]
  appUrl: string
}

export function WarrantyReminderEmail({
  email,
  warranties,
  appUrl,
}: WarrantyReminderEmailProps) {
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
              Rappel de garanties
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
              {warranties.length === 1
                ? 'Voici un rappel pour la garantie suivante :'
                : `Voici un rappel pour les ${warranties.length} garanties suivantes :`}
            </Text>

            {warranties.map((w, i) => (
              <Section
                key={i}
                style={{
                  backgroundColor: '#fefce8',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '10px',
                  borderLeft: '4px solid #f59e0b',
                }}
              >
                <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '14px', margin: '0 0 4px' }}>
                  {w.title}
                </Text>
                <Text style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                  Expire le {w.expiryDate} · {w.daysLeft} jour{w.daysLeft > 1 ? 's' : ''} restant{w.daysLeft > 1 ? 's' : ''}
                </Text>
              </Section>
            ))}

            <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0' }} />

            <Button
              href={appUrl}
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
              Voir mes garanties →
            </Button>

            <Text style={{ color: '#94a3b8', fontSize: '12px', marginTop: '24px', marginBottom: 0 }}>
              Vous recevez cet email car votre compte ZenGarantie ({email}) a des rappels de garanties configurés.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
