// Share the canonical address rules between the form and the publish API.
const reserved=new Set(['admin','api','www','app','support','help']);
export function normalizePortfolioAddress(value){return String(value??'').trim().toLowerCase().replace(/[\s._]+/g,'-').replace(/-+/g,'-');}
export function portfolioAddressError(value){
 const slug=normalizePortfolioAddress(value);
 if(slug.includes('/')||slug.includes(':'))return 'Enter an address name only, such as mikha-gerges, without a full URL.';
 if(slug.length<3||slug.length>30)return 'Use an address between 3 and 30 characters.';
 if(!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug))return 'Use English letters, numbers and hyphens. Start and end with a letter or number.';
 if(reserved.has(slug))return 'This address is reserved. Choose another one.';
 return '';
}
