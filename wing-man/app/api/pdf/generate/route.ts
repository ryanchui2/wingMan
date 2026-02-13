import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { DatePlanPDF } from '@/lib/pdf/DatePlanPDF';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const { dateName, content } = await req.json();

    if (!dateName || !content) {
      return NextResponse.json(
        { error: 'Date name and content are required' },
        { status: 400 }
      );
    }

    // Get user name if logged in
    const userName = session?.user?.name || undefined;

    // Generate PDF
    const pdfDocument = DatePlanPDF({
      dateName,
      content,
      userName,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfStream = await renderToStream(pdfDocument as any);

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
      } else {
        chunks.push(Buffer.from(chunk));
      }
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${dateName.replace(/[^a-z0-9]/gi, '_')}_wingMan.pdf"`,
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
