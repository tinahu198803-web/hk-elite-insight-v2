import { NextResponse } from 'next/server';
import expertsConfig from '../../config/experts.json';

// 获取专家列表
export async function GET() {
  try {
    const experts = expertsConfig.experts
      .filter(expert => expert.isActive)
      .map(expert => ({
        id: expert.id,
        name: expert.name,
        icon: expert.icon,
        description: expert.description,
        color: expert.color,
        features: expert.features,
        price: expert.price,
        version: expert.version
      }));

    return NextResponse.json({
      success: true,
      data: experts,
      settings: expertsConfig.settings
    });
  } catch (error: any) {
    console.error('Get experts error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// 获取单个专家详情
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { expertId } = body;

    const expert = expertsConfig.experts.find(e => e.id === expertId);

    if (!expert) {
      return NextResponse.json({
        success: false,
        error: '专家不存在'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: expert.id,
        name: expert.name,
        icon: expert.icon,
        description: expert.description,
        color: expert.color,
        systemPrompt: expert.systemPrompt,
        temperature: expert.temperature,
        maxTokens: expert.maxTokens,
        price: expert.price,
        features: expert.features,
        version: expert.version,
        lastUpdated: expert.lastUpdated
      }
    });
  } catch (error: any) {
    console.error('Get expert detail error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
