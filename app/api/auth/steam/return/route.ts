import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { getPrisma } from '@/lib/prisma';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
const STEAM_ID_REGEX = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

async function verifySteamOpenId(params: URLSearchParams): Promise<string | null> {
  const verifyParams = new URLSearchParams(params);
  verifyParams.set('openid.mode', 'check_authentication');

  const response = await fetch(STEAM_OPENID_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyParams.toString(),
  });

  const text = await response.text();
  if (!text.includes('is_valid:true')) return null;

  const claimedId = params.get('openid.claimed_id') || '';
  const match = claimedId.match(STEAM_ID_REGEX);
  return match ? match[1] : null;
}

async function getSteamProfile(steamId: string) {
  const apiKey = process.env.STEAM_API_KEY;
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`;
  const res = await fetch(url);
  const data = await res.json();
  const players = data?.response?.players;
  if (!players || players.length === 0) return null;
  return players[0];
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:5000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || getBaseUrl(req);
  const { searchParams } = new URL(req.url);

  try {
    const steamId = await verifySteamOpenId(searchParams);
    if (!steamId) {
      return NextResponse.redirect(`${baseUrl}/?auth=failed`);
    }

    const profile = await getSteamProfile(steamId);
    if (!profile) {
      return NextResponse.redirect(`${baseUrl}/?auth=failed`);
    }

    const prisma = getPrisma();
    let user = await prisma.user.findUnique({ where: { steamId } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          steamId,
          username: profile.personaname,
          avatarUrl: profile.avatarfull,
          balance: 150.00,
          nonce: 0,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { username: profile.personaname, avatarUrl: profile.avatarfull },
      });
    }

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = user.id;
    await session.save();

    return NextResponse.redirect(`${baseUrl}/`);
  } catch (error) {
    console.error('Steam auth error:', error);
    return NextResponse.redirect(`${baseUrl}/?auth=error`);
  }
}
