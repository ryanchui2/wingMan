import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { DatePlanPDF } from '@/lib/pdf/DatePlanPDF';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const { dateName, content, conversationId } = await req.json();

    if (!dateName || !content) {
      return NextResponse.json(
        { error: 'Date name and content are required' },
        { status: 400 }
      );
    }

    // Get user name if logged in
    const userName = session?.user?.name || undefined;

    // Generate PDF
    const pdfStream = await renderToStream(
      DatePlanPDF({
        dateName,
        content,
        userName,
      })
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${dateName.replace(/[^a-z0-9]/gi, '_')}_date_plan.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
