const http = require('http');
const https = require('https');

async function testKYC() {
  const url = 'https://ghs.oneweekmvps.com/api/team';
  // Let's first get a team member to test the route
  const res = await fetch(url);
  const data = await res.json();
  const members = data.data || data;
  if(members && members.length > 0) {
    const memId = members[0].id;
    console.log("Team Member ID:", memId);
    const kycRes = await fetch(url + '/' + memId + '/kyc');
    console.log("KYC Status:", kycRes.status);
    console.log("KYC Body:", await kycRes.text());
  } else {
    console.log("No team members found.");
  }
}
testKYC();
