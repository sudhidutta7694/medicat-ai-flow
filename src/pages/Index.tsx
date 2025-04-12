
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { MessageSquare, Calendar, ClipboardList, ArrowRight, Stethoscope } from 'lucide-react';

const Index = () => {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-blue-50 py-16">
        <div className="mediflow-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Streamlined Healthcare Communication
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Connect with your healthcare providers, manage your medical history,
              and get AI-assisted health guidance all in one secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/chat">
                  Start AI Consultation <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/profile">
                  Complete Your Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="mediflow-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              HIPAA-Compliant Healthcare Platform
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              MediFlow helps streamline the interaction between patients and doctors with AI-assisted
              tools for better healthcare management.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="mediflow-card p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-mediblue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Chatbot</h3>
              <p className="text-gray-600">
                Get preliminary diagnosis suggestions and answer medical questions through
                our intelligent chatbot before speaking with your doctor.
              </p>
              <Button variant="link" className="mt-4" asChild>
                <Link to="/chat">
                  Try the AI Chat <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Feature 2 */}
            <div className="mediflow-card p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-mediblue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Medical Timeline</h3>
              <p className="text-gray-600">
                Track your medical history, prescriptions, and doctor visits in a
                clear timeline view for better healthcare management.
              </p>
              <Button variant="link" className="mt-4" asChild>
                <Link to="/timeline">
                  View Your Timeline <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Feature 3 */}
            <div className="mediflow-card p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="h-6 w-6 text-mediblue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Report Generation</h3>
              <p className="text-gray-600">
                Automatic generation of medical reports and prescriptions that can
                be shared securely via WhatsApp or email.
              </p>
              <Button variant="link" className="mt-4" asChild>
                <Link to="/profile">
                  View Your Reports <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-mediblue-600 py-16 text-white">
        <div className="mediflow-container">
          <div className="max-w-3xl mx-auto text-center">
            <Stethoscope className="h-16 w-16 mx-auto mb-6 text-white/80" />
            <h2 className="text-3xl font-bold mb-4">Ready to transform your healthcare experience?</h2>
            <p className="text-xl mb-8 text-white/90">
              Join thousands of patients and doctors who are already using MediFlow to
              streamline their healthcare communication.
            </p>
            <Button size="lg" variant="secondary" className="bg-white text-mediblue-600 hover:bg-blue-50" asChild>
              <Link to="/profile">
                Create Your Profile Today
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
