import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { DatePlan } from '../store/dateStore';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #e53e3e',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  text: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#444',
  },
  activity: {
    fontSize: 11,
    marginLeft: 15,
    marginBottom: 5,
    color: '#555',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#999',
  },
});

interface DatePlanPDFProps {
  datePlan: DatePlan;
}

export const DatePlanPDF: React.FC<DatePlanPDFProps> = ({ datePlan }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{datePlan.title}</Text>
        <Text style={styles.subtitle}>
          {new Date(datePlan.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.text}>{datePlan.location}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.text}>{datePlan.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activities</Text>
        {datePlan.activities.map((activity, index) => (
          <Text key={index} style={styles.activity}>
            • {activity}
          </Text>
        ))}
      </View>

      {datePlan.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.text}>{datePlan.notes}</Text>
        </View>
      )}

      <Text style={styles.footer}>
        Created with wingMan - Your AI Dating Assistant
      </Text>
    </Page>
  </Document>
);
