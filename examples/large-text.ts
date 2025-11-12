import { prunize } from 'prunize';

/**
 * Test prunize with large text prompts
 * Demonstrates token efficiency for real-world PRD and documentation
 * 
 * This is an independent test file that uses the published npm package.
 * Run: npm install prunize && npx ts-node test/large-text-test.ts
 */

// Large PRD example - Product Requirements Document
const largePRD = `
# Product Requirements Document: Mobile Banking App

## 1. Overview
The mobile banking application aims to provide users with a comprehensive digital banking experience, 
enabling them to manage their finances on-the-go with security, convenience, and real-time insights.

## 2. Objectives
- Enable users to perform all essential banking operations from their mobile devices
- Provide real-time account balance and transaction history
- Ensure bank-grade security with biometric authentication
- Offer personalized financial insights and recommendations
- Support multiple account types (savings, checking, credit cards)

## 3. User Stories

### 3.1 Account Management
- As a user, I want to view my account balances in real-time
- As a user, I want to see my recent transaction history with filters
- As a user, I want to download account statements in PDF format
- As a user, I want to set up account alerts for low balance or large transactions

### 3.2 Fund Transfers
- As a user, I want to transfer money between my own accounts instantly
- As a user, I want to send money to other users using their phone number or email
- As a user, I want to schedule recurring transfers for bills and savings
- As a user, I want to set transfer limits for added security

### 3.3 Bill Payments
- As a user, I want to pay utility bills directly from the app
- As a user, I want to save billers for quick future payments
- As a user, I want to schedule automatic bill payments
- As a user, I want to receive payment confirmations via push notifications

### 3.4 Security Features
- As a user, I want to log in using fingerprint or face recognition
- As a user, I want to receive alerts for suspicious activity
- As a user, I want to temporarily block my cards if lost or stolen
- As a user, I want to set up two-factor authentication

## 4. Technical Requirements

### 4.1 Platform Support
- iOS 14.0 and above
- Android 10.0 and above
- Tablet support for both platforms
- Responsive design for various screen sizes

### 4.2 Performance
- App launch time: < 2 seconds
- Transaction processing: < 3 seconds
- API response time: < 1 second
- Offline mode for viewing cached data
- Maximum app size: 50MB

### 4.3 Security
- End-to-end encryption for all data transmission
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- Session timeout after 5 minutes of inactivity
- Secure storage for sensitive data using device keychain
- PCI DSS compliance for payment processing
- Regular security audits and penetration testing

### 4.4 Integration
- Core banking system API integration
- Payment gateway integration (Stripe, PayPal)
- SMS and email notification services
- Analytics platform (Google Analytics, Mixpanel)
- Push notification service (Firebase Cloud Messaging)
- Document generation service for statements

## 5. Non-Functional Requirements

### 5.1 Availability
- 99.9% uptime guarantee
- Scheduled maintenance windows: Sundays 2-4 AM
- Disaster recovery plan with < 4 hour RTO
- Database backup every 6 hours

### 5.2 Scalability
- Support for 1 million concurrent users
- Handle 10,000 transactions per second during peak hours
- Auto-scaling infrastructure based on load
- CDN for static assets

### 5.3 Compliance
- GDPR compliance for European users
- SOC 2 Type II certification
- Local banking regulations compliance
- Accessibility standards (WCAG 2.1 Level AA)

### 5.4 Monitoring
- Real-time error tracking and alerting
- Performance monitoring and APM
- User behavior analytics
- Crash reporting with detailed stack traces

## 6. User Interface Requirements

### 6.1 Design Principles
- Clean and intuitive interface
- Consistent with platform design guidelines (Material Design for Android, Human Interface Guidelines for iOS)
- Accessibility features for users with disabilities
- Support for dark mode
- Localization for multiple languages (English, Spanish, French, German, Japanese)

### 6.2 Key Screens
1. Login/Registration Screen
2. Dashboard with account overview
3. Transaction history with search and filters
4. Transfer money screen with recipient selection
5. Bill payment screen with saved billers
6. Card management screen
7. Settings and profile management
8. Help and support center

## 7. Timeline and Milestones

### Phase 1: MVP (3 months)
- User authentication and account view
- Basic fund transfers
- Transaction history
- Bill payment functionality

### Phase 2: Enhanced Features (2 months)
- Biometric authentication
- Card management
- Scheduled transfers
- Push notifications

### Phase 3: Advanced Features (2 months)
- Financial insights and analytics
- Budget tracking
- Spending categorization
- Investment account integration

## 8. Success Metrics
- User adoption: 100,000 active users in first 6 months
- User engagement: Average 3 sessions per week
- Transaction volume: $10 million processed monthly
- Customer satisfaction: NPS score > 50
- App store rating: 4.5+ stars
- Crash rate: < 0.1%
- API success rate: > 99.5%

## 9. Risks and Mitigation

### 9.1 Security Risks
- Risk: Data breach or unauthorized access
- Mitigation: Multi-layer security, regular audits, encryption

### 9.2 Technical Risks
- Risk: Integration failures with core banking system
- Mitigation: Comprehensive API testing, fallback mechanisms

### 9.3 User Adoption Risks
- Risk: Low user adoption rate
- Mitigation: User-friendly design, marketing campaigns, referral programs

## 10. Dependencies
- Core banking system API availability
- Payment gateway partnerships
- Mobile platform updates and compatibility
- Security certification approvals
- Third-party service providers (SMS, email, analytics)

## 11. Budget Estimate
- Development: $500,000
- Infrastructure: $100,000/year
- Security and compliance: $50,000
- Marketing and user acquisition: $200,000
- Ongoing maintenance: $150,000/year
- Total Year 1: $1,000,000
`;

// Large JSON configuration
const largeConfig = {
  "application": {
    "name": "Mobile Banking App",
    "version": "1.0.0",
    "environment": "production",
    "region": "us-east-1"
  },
  "features": {
    "authentication": {
      "enabled": true,
      "methods": ["biometric", "password", "2fa"],
      "sessionTimeout": 300,
      "maxLoginAttempts": 3
    },
    "accounts": {
      "enabled": true,
      "types": ["checking", "savings", "credit"],
      "realTimeBalance": true,
      "transactionHistory": {
        "maxDays": 90,
        "itemsPerPage": 20,
        "exportFormats": ["pdf", "csv", "excel"]
      }
    },
    "transfers": {
      "enabled": true,
      "internal": {
        "enabled": true,
        "instantTransfer": true,
        "maxAmount": 10000
      },
      "external": {
        "enabled": true,
        "processingTime": "1-3 business days",
        "maxAmount": 5000,
        "dailyLimit": 10000
      },
      "scheduled": {
        "enabled": true,
        "recurring": true,
        "maxScheduledTransfers": 10
      }
    },
    "billPayment": {
      "enabled": true,
      "categories": ["utilities", "credit cards", "loans", "insurance", "subscription"],
      "autopay": true,
      "savedPayees": {
        "max": 50,
        "verificationRequired": true
      }
    },
    "cards": {
      "enabled": true,
      "operations": ["view", "lock", "unlock", "reportLost", "setPIN"],
      "virtualCards": true,
      "cardControls": {
        "spendingLimits": true,
        "merchantBlocking": true,
        "internationalTransactions": true
      }
    },
    "notifications": {
      "enabled": true,
      "channels": ["push", "sms", "email"],
      "types": [
        "lowBalance",
        "largeTransaction",
        "loginAlert",
        "billDue",
        "transferComplete",
        "securityAlert"
      ],
      "customizable": true
    },
    "security": {
      "encryption": "AES-256",
      "tls": "1.3",
      "certificatePinning": true,
      "biometric": {
        "faceID": true,
        "touchID": true,
        "fingerprint": true
      },
      "fraudDetection": {
        "enabled": true,
        "realTime": true,
        "riskScoring": true
      }
    },
    "analytics": {
      "enabled": true,
      "providers": ["google-analytics", "mixpanel", "amplitude"],
      "events": [
        "app_launch",
        "login_success",
        "transaction_initiated",
        "transaction_complete",
        "error_occurred",
        "feature_used"
      ]
    }
  },
  "integrations": {
    "coreBanking": {
      "endpoint": "https://api.bank.example.com/v2",
      "timeout": 30000,
      "retryAttempts": 3,
      "rateLimit": 1000
    },
    "paymentGateway": {
      "provider": "stripe",
      "apiKey": "pk_live_xxxxxxxxxxxx",
      "webhookSecret": "whsec_xxxxxxxxxxxx"
    },
    "notifications": {
      "push": {
        "provider": "firebase",
        "projectId": "mobile-banking-app"
      },
      "sms": {
        "provider": "twilio",
        "accountSid": "ACxxxxxxxxxxxxxxxxxx"
      },
      "email": {
        "provider": "sendgrid",
        "apiKey": "SG.xxxxxxxxxxxx"
      }
    }
  },
  "performance": {
    "caching": {
      "enabled": true,
      "ttl": 300,
      "strategy": "cache-first"
    },
    "compression": {
      "enabled": true,
      "algorithm": "gzip"
    },
    "cdn": {
      "enabled": true,
      "provider": "cloudflare",
      "regions": ["us", "eu", "asia"]
    }
  }
};

console.log('='.repeat(80));
console.log('PRUNIZE - Large Text Optimization Test');
console.log('='.repeat(80));
console.log();

// Test 1: Large PRD with auto-decision
console.log('📄 Test 1: Large Product Requirements Document (PRD)');
console.log('-'.repeat(80));
const prdResult = prunize(largePRD, { 
  optimizeSnippets: 'auto',
  verbose: true
});

console.log(`Original text length: ${largePRD.length.toLocaleString()} characters`);
console.log(`Optimized text length: ${prdResult.output.length.toLocaleString()} characters`);
console.log(`Output format: ${prdResult.format}`);
console.log(`Detection confidence: ${(prdResult.confidence * 100).toFixed(1)}%`);
if (prdResult.autoDecision) {
  console.log(`Auto-decision: ${prdResult.autoDecision.enabled ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Reason: ${prdResult.autoDecision.reason}`);
  console.log(`Decision time: ${prdResult.autoDecision.decisionTimeMs.toFixed(2)}ms`);
  if (prdResult.autoDecision.stats) {
    console.log(`Snippets found: ${prdResult.autoDecision.stats.totalSnippets} (${prdResult.autoDecision.stats.optimizableSnippets} optimizable)`);
  }
}
console.log();
console.log('💰 Token Efficiency:');
console.log(`  Original tokens: ${prdResult.tokens.before.toLocaleString()}`);
console.log(`  Optimized tokens: ${prdResult.tokens.after.toLocaleString()}`);
console.log(`  Tokens saved: ${(prdResult.tokens.before - prdResult.tokens.after).toLocaleString()}`);
console.log(`  Efficiency: ${prdResult.tokens.savings} reduction`);
console.log();

// Test 2: Large JSON configuration (auto-detect best format)
console.log('⚙️  Test 2: Large JSON Configuration');
console.log('-'.repeat(80));
const configResult = prunize(largeConfig, { 
  optimizeSnippets: false,
  verbose: true
});

console.log(`Original JSON size: ${JSON.stringify(largeConfig, null, 2).length.toLocaleString()} characters`);
console.log(`Optimized size: ${configResult.output.length.toLocaleString()} characters`);
console.log(`Output format: ${configResult.format}`);
console.log(`Detection confidence: ${(configResult.confidence * 100).toFixed(1)}%`);
console.log();
console.log('💰 Token Efficiency:');
console.log(`  Original tokens: ${configResult.tokens.before.toLocaleString()}`);
console.log(`  Optimized tokens: ${configResult.tokens.after.toLocaleString()}`);
console.log(`  Tokens saved: ${(configResult.tokens.before - configResult.tokens.after).toLocaleString()}`);
console.log(`  Efficiency: ${configResult.tokens.savings} reduction`);
console.log();

// Test 3: Large Transaction Data (array data)
const transactionData = Array.from({ length: 100 }, (_, i) => ({
  id: `TXN-${String(i + 1).padStart(6, '0')}`,
  date: new Date(2025, 0, 1 + i).toISOString().split('T')[0],
  description: `Transaction ${i + 1}`,
  amount: (Math.random() * 1000).toFixed(2),
  category: ['groceries', 'utilities', 'entertainment', 'transport', 'healthcare'][i % 5],
  status: ['completed', 'pending', 'failed'][i % 3],
  merchant: `Merchant ${String.fromCharCode(65 + (i % 26))}`,
  paymentMethod: ['credit', 'debit', 'cash'][i % 3]
}));

console.log('📊 Test 3: Large Transaction Data (Array)');
console.log('-'.repeat(80));
const csvResult = prunize(transactionData, { 
  optimizeSnippets: false,
  verbose: true
});

console.log(`Original JSON size: ${JSON.stringify(transactionData, null, 2).length.toLocaleString()} characters`);
console.log(`Optimized size: ${csvResult.output.length.toLocaleString()} characters`);
console.log(`Number of records: ${transactionData.length}`);
console.log(`Output format: ${csvResult.format}`);
console.log(`Detection confidence: ${(csvResult.confidence * 100).toFixed(1)}%`);
console.log();
console.log('💰 Token Efficiency:');
console.log(`  Original tokens: ${csvResult.tokens.before.toLocaleString()}`);
console.log(`  Optimized tokens: ${csvResult.tokens.after.toLocaleString()}`);
console.log(`  Tokens saved: ${(csvResult.tokens.before - csvResult.tokens.after).toLocaleString()}`);
console.log(`  Efficiency: ${csvResult.tokens.savings} reduction`);
console.log();

// Summary
console.log('='.repeat(80));
console.log('📈 SUMMARY - Total Token Savings');
console.log('='.repeat(80));
const totalOriginal = prdResult.tokens.before + configResult.tokens.before + csvResult.tokens.before;
const totalOptimized = prdResult.tokens.after + configResult.tokens.after + csvResult.tokens.after;
const totalSaved = totalOriginal - totalOptimized;
const totalEfficiency = (totalSaved / totalOriginal) * 100;

// Estimate cost savings using GPT-4 pricing: $2.50 per 1M input tokens
const costPerMillionTokens = 2.50;
const totalCostSavings = (totalSaved / 1000000) * costPerMillionTokens;

console.log(`Total original tokens: ${totalOriginal.toLocaleString()}`);
console.log(`Total optimized tokens: ${totalOptimized.toLocaleString()}`);
console.log(`Total tokens saved: ${totalSaved.toLocaleString()}`);
console.log(`Overall efficiency: ${totalEfficiency.toFixed(2)}% reduction`);
console.log(`Cost savings per request: $${totalCostSavings.toFixed(6)}`);
console.log(`Cost savings (100K requests): $${(totalCostSavings * 100000).toFixed(2)}`);
console.log(`Cost savings (1M requests): $${(totalCostSavings * 1000000).toFixed(2)}`);
console.log();
console.log('✅ All tests completed successfully!');
console.log('='.repeat(80));
