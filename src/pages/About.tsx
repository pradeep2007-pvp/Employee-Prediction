import { Info, Brain, TrendingUp, Database, GitBranch, Award, ArrowDown } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export function About() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">About Project</h1>
        <p className="text-sm text-slate-500 mt-1">HR DataMiner — Workforce Intelligence & Prediction</p>
      </div>

      <div className="space-y-6">
        {/* Project Objective */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-navy-50 text-navy-700">
              <Info size={22} />
            </div>
            <h2 className="text-base font-semibold text-navy-900">Project Objective</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Employee attrition and salary prediction are critical challenges for HR departments.
            This project applies data mining and machine learning techniques to analyze employee
            data and predict two key outcomes: whether an employee is likely to leave the
            organization (attrition), and what their estimated salary should be based on their
            professional characteristics. These predictions help HR teams make proactive,
            data-driven decisions about retention strategies, compensation planning, and
            workforce management.
          </p>
        </div>

        {/* Dataset */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600">
              <Database size={22} />
            </div>
            <h2 className="text-base font-semibold text-navy-900">Dataset</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-navy-700 mb-2">Employee Records</p>
              <p className="text-sm text-slate-600">
                The dataset consists of employee records containing personal information,
                employment details, work characteristics, and income data.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-700 mb-2">Features</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>Age, Gender, Education Level</li>
                <li>Department, Job Role, Years at Company</li>
                <li>Overtime, Job Satisfaction, Work-Life Balance</li>
                <li>Performance Rating, Monthly Income</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-700 mb-2">Target Variables</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li><strong>Attrition</strong> — Binary: Leave / Stay</li>
                <li><strong>Salary</strong> — Numeric: Monthly salary value</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Mining Process */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-green-50 text-green-600">
              <GitBranch size={22} />
            </div>
            <h2 className="text-base font-semibold text-navy-900">Data Mining Process</h2>
          </div>
          <div className="flex flex-col items-center gap-0">
            {['Data Collection', 'Data Cleaning', 'Preprocessing', 'Feature Engineering', 'Model Training', 'Model Evaluation', 'Prediction'].map((step, i, arr) => (
              <div key={step} className="flex flex-col items-center">
                <div className="px-6 py-3 bg-navy-50 text-navy-700 rounded-xl text-sm font-medium w-full text-center max-w-xs">
                  {step}
                </div>
                {i < arr.length - 1 && <ArrowDown className="text-slate-300 my-1" size={20} />}
              </div>
            ))}
          </div>
        </div>

        {/* Algorithms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-red-50 text-red-600">
                <Brain size={22} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-navy-900">Logistic Regression</h2>
                <p className="text-xs text-slate-400">Attrition Classification</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Logistic Regression is a statistical model used for binary classification.
              It models the probability of an employee leaving (attrition = 1) versus staying
              (attrition = 0) as a function of the input features. The model applies a sigmoid
              function to a linear combination of features, producing a probability between 0
              and 1. A threshold (typically 0.5) is then applied to classify the outcome.
            </p>
            <div className="mt-4 bg-slate-50 rounded-xl p-3 text-xs text-slate-500 font-mono">
              P(Attrition) = 1 / (1 + e^(-z))<br />
              where z = w₁x₁ + w₂x₂ + ... + b
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600">
                <TrendingUp size={22} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-navy-900">Multiple Linear Regression</h2>
                <p className="text-xs text-slate-400">Salary Prediction</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Multiple Linear Regression models the relationship between multiple independent
              variables (experience, education, job role, performance, etc.) and a continuous
              dependent variable (salary). The model finds the best-fitting linear relationship
              by minimizing the sum of squared residuals between predicted and actual values.
            </p>
            <div className="mt-4 bg-slate-50 rounded-xl p-3 text-xs text-slate-500 font-mono">
              Salary = w₁x₁ + w₂x₂ + ... + wₙxₙ + b<br />
              where x = features, w = weights, b = bias
            </div>
          </div>
        </div>

        {/* Project Benefits */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 text-amber-600">
              <Award size={22} />
            </div>
            <h2 className="text-base font-semibold text-navy-900">Project Benefits</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Helps identify possible attrition risk before it happens',
              'Supports workforce analysis and planning',
              'Provides data-driven salary estimates',
              'Helps HR teams make informed retention decisions',
              'Provides data-driven insights for management',
              'Demonstrates practical application of data mining',
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
                <p className="text-sm text-slate-600">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Disclaimer */}
        <div className="card p-5 bg-amber-50/40 border-amber-100">
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Academic Note:</strong> This is a Data Mining / Machine Learning project.
            Predictions are estimates based on the trained models and available employee data.
            They are not guaranteed outcomes and should not be used as the sole basis for
            employment decisions. The models use Logistic Regression and Multiple Linear
            Regression — standard algorithms that provide reasonable but not perfect predictions.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
