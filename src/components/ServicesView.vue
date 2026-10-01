<script setup>
import { ref, inject } from 'vue'

const t = inject('t')

const journeys = ref([
  {
    id: 'business-registration',
    title: 'Register a Business',
    description: 'Step-by-step guide to registering a company in Nigeria',
    steps: [
      {
        num: 1,
        name: 'Check business name availability',
        agency: 'Corporate Affairs Commission (CAC)',
        url: 'https://www.cac.gov.ng/newcompanypage/namecheck',
        requirements: ['Proposed business name', 'Owner details'],
        timeline: '1–3 days',
        cost: '₦5,000–₦10,000',
        notes: 'Search the CAC registry to ensure your name is available and unique.'
      },
      {
        num: 2,
        name: 'Register company with CAC',
        agency: 'Corporate Affairs Commission (CAC)',
        url: 'https://www.cac.gov.ng/registration/',
        requirements: ['Form CAC 2 (Articles of Association)', 'Incorporation documents', 'Directors and shareholders info'],
        timeline: '3–5 days',
        cost: '₦20,000–₦50,000',
        notes: 'File incorporation documents and get your RC number (registration certificate).'
      },
      {
        num: 3,
        name: 'Obtain Tax Identification Number (TIN)',
        agency: 'Federal Inland Revenue Service (FIRS)',
        url: 'https://www.firs.gov.ng/businesstaxonline/',
        requirements: ['CAC RC number', 'Business address', 'Business details'],
        timeline: '1–2 days',
        cost: 'Free',
        notes: 'Register with FIRS online or at local tax office. TIN is required for all tax matters.'
      },
      {
        num: 4,
        name: 'Open a business bank account',
        agency: 'Your chosen bank',
        url: 'https://www.cbn.gov.ng/out/publications/guidelines/dsg/guidelines_for_account_opening.pdf',
        requirements: ['CAC RC number', 'TIN', 'Directors ID proofs', 'Proof of address'],
        timeline: '1–3 days',
        cost: 'Free (varies by bank)',
        notes: 'Contact your preferred bank. Requirements vary; some banks streamlined online.'
      },
      {
        num: 5,
        name: 'Register for State Board of Internal Revenue (optional)',
        agency: 'Your State SBIR',
        url: 'https://sbir.ng/',
        requirements: ['Business registration details', 'Proof of address in state'],
        timeline: '1–2 days',
        cost: 'Varies by state',
        notes: 'Required if you operate within a specific state. Check your state SBIR portal.'
      }
    ]
  }
])

const expandedStep = ref(null)

function toggleStep(stepNum) {
  expandedStep.value = expandedStep.value === stepNum ? null : stepNum
}
</script>

<template>
  <div class="sv-container">
    <div class="sv-header">
      <h1>Government Services Guide</h1>
      <p>Find official government resources for common Nigerian procedures.</p>
    </div>

    <div class="sv-journey" v-for="journey in journeys" :key="journey.id">
      <div class="sv-journey-header">
        <h2>{{ journey.title }}</h2>
        <p class="sv-journey-desc">{{ journey.description }}</p>
      </div>

      <div class="sv-steps">
        <div
          v-for="step in journey.steps"
          :key="step.num"
          :class="['sv-step', { expanded: expandedStep === step.num }]"
        >
          <div class="sv-step-trigger" @click="toggleStep(step.num)">
            <div class="sv-step-num">{{ step.num }}</div>
            <div class="sv-step-title">{{ step.name }}</div>
            <div class="sv-step-agency">{{ step.agency }}</div>
            <div class="sv-expand-icon">{{ expandedStep === step.num ? '−' : '+' }}</div>
          </div>

          <div v-if="expandedStep === step.num" class="sv-step-details">
            <div class="sv-detail-row">
              <span class="sv-detail-label">Timeline:</span>
              <span class="sv-detail-value">{{ step.timeline }}</span>
            </div>
            <div class="sv-detail-row">
              <span class="sv-detail-label">Cost:</span>
              <span class="sv-detail-value">{{ step.cost }}</span>
            </div>
            <div class="sv-detail-row">
              <span class="sv-detail-label">What you need:</span>
              <ul class="sv-requirements">
                <li v-for="(req, i) in step.requirements" :key="i">{{ req }}</li>
              </ul>
            </div>
            <div class="sv-detail-row">
              <span class="sv-detail-label">Notes:</span>
              <p class="sv-detail-note">{{ step.notes }}</p>
            </div>
            <div class="sv-detail-row">
              <a :href="step.url" target="_blank" class="sv-link">
                Visit official website →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sv-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.sv-header {
  text-align: center;
  margin-bottom: 3rem;
}

.sv-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ink, #132a1d);
  margin: 0 0 0.5rem 0;
}

.sv-header p {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

.sv-journey {
  margin-bottom: 3rem;
}

.sv-journey-header {
  margin-bottom: 2rem;
}

.sv-journey-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ink, #132a1d);
  margin: 0 0 0.5rem 0;
}

.sv-journey-desc {
  color: #666;
  margin: 0;
  font-size: 0.95rem;
}

.sv-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sv-step {
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.sv-step.expanded {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sv-step-trigger {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  cursor: pointer;
  background: #f9f9f9;
  border-bottom: 1px solid #eee;
  transition: background 0.2s;
}

.sv-step.expanded .sv-step-trigger {
  background: var(--accent, #0a6b45);
  color: white;
  border-bottom-color: transparent;
}

.sv-step-trigger:hover {
  background: #f0f0f0;
}

.sv-step.expanded .sv-step-trigger:hover {
  background: var(--accent, #0a6b45);
}

.sv-step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  background: var(--accent, #0a6b45);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.sv-step.expanded .sv-step-num {
  background: white;
  color: var(--accent, #0a6b45);
}

.sv-step-title {
  flex: 1;
  font-weight: 600;
  color: var(--ink, #132a1d);
}

.sv-step.expanded .sv-step-title {
  color: white;
}

.sv-step-agency {
  font-size: 0.85rem;
  color: #888;
  max-width: 200px;
  text-align: right;
}

.sv-step.expanded .sv-step-agency {
  color: rgba(255, 255, 255, 0.8);
}

.sv-expand-icon {
  font-size: 1.5rem;
  font-weight: 300;
  color: #666;
}

.sv-step.expanded .sv-expand-icon {
  color: white;
}

.sv-step-details {
  padding: 1.5rem;
  background: #f9f9f9;
}

.sv-detail-row {
  margin-bottom: 1.5rem;
}

.sv-detail-row:last-child {
  margin-bottom: 0;
}

.sv-detail-label {
  display: block;
  font-weight: 600;
  color: var(--ink, #132a1d);
  margin-bottom: 0.5rem;
}

.sv-detail-value {
  color: #666;
}

.sv-requirements {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sv-requirements li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: #666;
}

.sv-requirements li:before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--accent, #0a6b45);
  font-weight: bold;
}

.sv-detail-note {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.sv-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--accent, #0a6b45);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.sv-link:hover {
  color: #054a2e;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .sv-step-trigger {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .sv-step-agency {
    order: 3;
    flex-basis: 100%;
    max-width: none;
    text-align: left;
    font-size: 0.8rem;
    padding-left: 2.5rem;
  }

  .sv-header h1 {
    font-size: 1.5rem;
  }

  .sv-journey-header h2 {
    font-size: 1.25rem;
  }
}
</style>
