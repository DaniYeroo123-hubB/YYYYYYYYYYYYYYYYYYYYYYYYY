export interface CityTimezone {
  cityName: string;
  country: string;
  timezone: string;
}

export const WORLD_CITIES: CityTimezone[] = [
  // --- NORTH AMERICA ---
  { cityName: 'New York', country: 'United States', timezone: 'America/New_York' },
  { cityName: 'Los Angeles', country: 'United States', timezone: 'America/Los_Angeles' },
  { cityName: 'Chicago', country: 'United States', timezone: 'America/Chicago' },
  { cityName: 'Houston', country: 'United States', timezone: 'America/Chicago' },
  { cityName: 'Phoenix', country: 'United States', timezone: 'America/Phoenix' },
  { cityName: 'Denver', country: 'United States', timezone: 'America/Denver' },
  { cityName: 'Seattle', country: 'United States', timezone: 'America/Los_Angeles' },
  { cityName: 'Miami', country: 'United States', timezone: 'America/New_York' },
  { cityName: 'San Francisco', country: 'United States', timezone: 'America/Los_Angeles' },
  { cityName: 'Boston', country: 'United States', timezone: 'America/New_York' },
  { cityName: 'Dallas', country: 'United States', timezone: 'America/Chicago' },
  { cityName: 'Atlanta', country: 'United States', timezone: 'America/New_York' },
  { cityName: 'Honolulu', country: 'United States', timezone: 'Pacific/Honolulu' },
  { cityName: 'Anchorage', country: 'United States', timezone: 'America/Anchorage' },
  { cityName: 'Juneau', country: 'United States', timezone: 'America/Juneau' },
  { cityName: 'Halifax', country: 'Canada', timezone: 'America/Halifax' },
  { cityName: 'Edmonton', country: 'Canada', timezone: 'America/Edmonton' },
  { cityName: 'Winnipeg', country: 'Canada', timezone: 'America/Winnipeg' },
  { cityName: 'St. John\'s', country: 'Canada', timezone: 'America/St_Johns' },
  { cityName: 'Toronto', country: 'Canada', timezone: 'America/Toronto' },
  { cityName: 'Vancouver', country: 'Canada', timezone: 'America/Vancouver' },
  { cityName: 'Montreal', country: 'Canada', timezone: 'America/Montreal' },
  { cityName: 'Calgary', country: 'Canada', timezone: 'America/Calgary' },
  { cityName: 'Ottawa', country: 'Canada', timezone: 'America/Toronto' },
  { cityName: 'Mexico City', country: 'Mexico', timezone: 'America/Mexico_City' },
  { cityName: 'Monterrey', country: 'Mexico', timezone: 'America/Monterrey' },
  { cityName: 'Havana', country: 'Cuba', timezone: 'America/Havana' },
  { cityName: 'Panama City', country: 'Panama', timezone: 'America/Panama' },
  { cityName: 'San Jose', country: 'Costa Rica', timezone: 'America/Costa_Rica' },
  { cityName: 'Kingston', country: 'Jamaica', timezone: 'America/Kingston' },
  { cityName: 'Santo Domingo', country: 'Dominican Republic', timezone: 'America/Santo_Domingo' },
  { cityName: 'Guatemala City', country: 'Guatemala', timezone: 'America/Guatemala' },
  { cityName: 'Belmopan', country: 'Belize', timezone: 'America/Belmopan' },
  { cityName: 'Tegucigalpa', country: 'Honduras', timezone: 'America/Tegucigalpa' },
  { cityName: 'San Salvador', country: 'El Salvador', timezone: 'America/El_Salvador' },
  { cityName: 'Managua', country: 'Nicaragua', timezone: 'America/Managua' },
  { cityName: 'Nassau', country: 'Bahamas', timezone: 'America/Nassau' },
  { cityName: 'San Juan', country: 'Puerto Rico', timezone: 'America/San_Juan' },
  { cityName: 'Bridgetown', country: 'Barbados', timezone: 'America/Barbados' },
  { cityName: 'Port of Spain', country: 'Trinidad and Tobago', timezone: 'America/Port_of_Spain' },
  { cityName: 'Willemstad', country: 'Curacao', timezone: 'America/Curacao' },
  { cityName: 'George Town', country: 'Cayman Islands', timezone: 'America/Cayman' },
  { cityName: 'Nuuk', country: 'Greenland', timezone: 'America/Nuuk' },

  // --- SOUTH AMERICA ---
  { cityName: 'São Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo' },
  { cityName: 'Rio de Janeiro', country: 'Brazil', timezone: 'America/Sao_Paulo' },
  { cityName: 'Brasilia', country: 'Brazil', timezone: 'America/Sao_Paulo' },
  { cityName: 'Manaus', country: 'Brazil', timezone: 'America/Manaus' },
  { cityName: 'Recife', country: 'Brazil', timezone: 'America/Recife' },
  { cityName: 'Buenos Aires', country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires' },
  { cityName: 'Santiago', country: 'Chile', timezone: 'America/Santiago' },
  { cityName: 'Bogota', country: 'Colombia', timezone: 'America/Bogota' },
  { cityName: 'Lima', country: 'Peru', timezone: 'America/Lima' },
  { cityName: 'Caracas', country: 'Venezuela', timezone: 'America/Caracas' },
  { cityName: 'Quito', country: 'Ecuador', timezone: 'America/Quito' },
  { cityName: 'Montevideo', country: 'Uruguay', timezone: 'America/Montevideo' },
  { cityName: 'La Paz', country: 'Bolivia', timezone: 'America/La_Paz' },
  { cityName: 'Asuncion', country: 'Paraguay', timezone: 'America/Asuncion' },
  { cityName: 'Georgetown', country: 'Guyana', timezone: 'America/Georgetown' },
  { cityName: 'Paramaribo', country: 'Suriname', timezone: 'America/Paramaribo' },

  // --- ATLANTIC & ISLANDS ---
  { cityName: 'Stanley', country: 'Falkland Islands', timezone: 'Atlantic/Stanley' },
  { cityName: 'Bermuda', country: 'United Kingdom', timezone: 'Atlantic/Bermuda' },
  { cityName: 'Azores', country: 'Portugal', timezone: 'Atlantic/Azores' },
  { cityName: 'Cape Verde', country: 'Cape Verde', timezone: 'Atlantic/Cape_Verde' },

  // --- EUROPE ---
  { cityName: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  { cityName: 'Paris', country: 'France', timezone: 'Europe/Paris' },
  { cityName: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin' },
  { cityName: 'Munich', country: 'Germany', timezone: 'Europe/Berlin' },
  { cityName: 'Frankfurt', country: 'Germany', timezone: 'Europe/Berlin' },
  { cityName: 'Rome', country: 'Italy', timezone: 'Europe/Rome' },
  { cityName: 'Milan', country: 'Italy', timezone: 'Europe/Rome' },
  { cityName: 'Madrid', country: 'Spain', timezone: 'Europe/Madrid' },
  { cityName: 'Barcelona', country: 'Spain', timezone: 'Europe/Madrid' },
  { cityName: 'Moscow', country: 'Russia', timezone: 'Europe/Moscow' },
  { cityName: 'Saint Petersburg', country: 'Russia', timezone: 'Europe/Moscow' },
  { cityName: 'Amsterdam', country: 'Netherlands', timezone: 'Europe/Amsterdam' },
  { cityName: 'Brussels', country: 'Belgium', timezone: 'Europe/Brussels' },
  { cityName: 'Vienna', country: 'Austria', timezone: 'Europe/Vienna' },
  { cityName: 'Geneva', country: 'Switzerland', timezone: 'Europe/Zurich' },
  { cityName: 'Zurich', country: 'Switzerland', timezone: 'Europe/Zurich' },
  { cityName: 'Stockholm', country: 'Sweden', timezone: 'Europe/Stockholm' },
  { cityName: 'Oslo', country: 'Norway', timezone: 'Europe/Oslo' },
  { cityName: 'Copenhagen', country: 'Denmark', timezone: 'Europe/Copenhagen' },
  { cityName: 'Helsinki', country: 'Finland', timezone: 'Europe/Helsinki' },
  { cityName: 'Warsaw', country: 'Poland', timezone: 'Europe/Warsaw' },
  { cityName: 'Prague', country: 'Czech Republic', timezone: 'Europe/Prague' },
  { cityName: 'Budapest', country: 'Hungary', timezone: 'Europe/Budapest' },
  { cityName: 'Athens', country: 'Greece', timezone: 'Europe/Athens' },
  { cityName: 'Lisbon', country: 'Portugal', timezone: 'Europe/Lisbon' },
  { cityName: 'Dublin', country: 'Ireland', timezone: 'Europe/Dublin' },
  { cityName: 'Kyiv', country: 'Ukraine', timezone: 'Europe/Kiev' },
  { cityName: 'Bucharest', country: 'Romania', timezone: 'Europe/Bucharest' },
  { cityName: 'Belgrade', country: 'Serbia', timezone: 'Europe/Belgrade' },
  { cityName: 'Sofia', country: 'Bulgaria', timezone: 'Europe/Sofia' },
  { cityName: 'Zagreb', country: 'Croatia', timezone: 'Europe/Zagreb' },
  { cityName: 'Bratislava', country: 'Slovakia', timezone: 'Europe/Bratislava' },
  { cityName: 'Tallinn', country: 'Estonia', timezone: 'Europe/Tallinn' },
  { cityName: 'Riga', country: 'Latvia', timezone: 'Europe/Riga' },
  { cityName: 'Vilnius', country: 'Lithuania', timezone: 'Europe/Vilnius' },
  { cityName: 'Reykjavik', country: 'Iceland', timezone: 'Atlantic/Reykjavik' },
  { cityName: 'Monaco', country: 'Monaco', timezone: 'Europe/Monaco' },
  { cityName: 'Istanbul', country: 'Turkey', timezone: 'Europe/Istanbul' },
  { cityName: 'Minsk', country: 'Belarus', timezone: 'Europe/Minsk' },
  { cityName: 'Chisinau', country: 'Moldova', timezone: 'Europe/Chisinau' },

  // --- AFRICA ---
  { cityName: 'Addis Ababa', country: 'Ethiopia', timezone: 'Africa/Addis_Ababa' },
  { cityName: 'Nairobi', country: 'Kenya', timezone: 'Africa/Nairobi' },
  { cityName: 'Cairo', country: 'Egypt', timezone: 'Africa/Cairo' },
  { cityName: 'Lagos', country: 'Nigeria', timezone: 'Africa/Lagos' },
  { cityName: 'Johannesburg', country: 'South Africa', timezone: 'Africa/Johannesburg' },
  { cityName: 'Cape Town', country: 'South Africa', timezone: 'Africa/Johannesburg' },
  { cityName: 'Casablanca', country: 'Morocco', timezone: 'Africa/Casablanca' },
  { cityName: 'Algiers', country: 'Algeria', timezone: 'Africa/Algiers' },
  { cityName: 'Tunis', country: 'Tunisia', timezone: 'Africa/Tunis' },
  { cityName: 'Tripoli', country: 'Libya', timezone: 'Africa/Tripoli' },
  { cityName: 'Accra', country: 'Ghana', timezone: 'Africa/Accra' },
  { cityName: 'Dakar', country: 'Senegal', timezone: 'Africa/Dakar' },
  { cityName: 'Abidjan', country: 'Ivory Coast', timezone: 'Africa/Abidjan' },
  { cityName: 'Luanda', country: 'Angola', timezone: 'Africa/Luanda' },
  { cityName: 'Kinshasa', country: 'Democratic Republic of the Congo', timezone: 'Africa/Kinshasa' },
  { cityName: 'Dar es Salaam', country: 'Tanzania', timezone: 'Africa/Dar_es_Salaam' },
  { cityName: 'Antananarivo', country: 'Madagascar', timezone: 'Indian/Antananarivo' },
  { cityName: 'Windhoek', country: 'Namibia', timezone: 'Africa/Windhoek' },
  { cityName: 'Maputo', country: 'Mozambique', timezone: 'Africa/Maputo' },
  { cityName: 'Harare', country: 'Zimbabwe', timezone: 'Africa/Harare' },
  { cityName: 'Lusaka', country: 'Zambia', timezone: 'Africa/Lusaka' },
  { cityName: 'Khartoum', country: 'Sudan', timezone: 'Africa/Khartoum' },
  { cityName: 'Kampala', country: 'Uganda', timezone: 'Africa/Kampala' },
  { cityName: 'Kigali', country: 'Rwanda', timezone: 'Africa/Kigali' },
  { cityName: 'Port Louis', country: 'Mauritius', timezone: 'Indian/Mauritius' },
  { cityName: 'Mahe', country: 'Seychelles', timezone: 'Indian/Mahe' },

  // --- MIDDLE EAST ---
  { cityName: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai' },
  { cityName: 'Abu Dhabi', country: 'United Arab Emirates', timezone: 'Asia/Dubai' },
  { cityName: 'Doha', country: 'Qatar', timezone: 'Asia/Qatar' },
  { cityName: 'Riyadh', country: 'Saudi Arabia', timezone: 'Asia/Riyadh' },
  { cityName: 'Jeddah', country: 'Saudi Arabia', timezone: 'Asia/Riyadh' },
  { cityName: 'Sanaa', country: 'Yemen', timezone: 'Asia/Sanaa' },
  { cityName: 'Manama', country: 'Bahrain', timezone: 'Asia/Bahrain' },
  { cityName: 'Kuwait City', country: 'Kuwait', timezone: 'Asia/Kuwait' },
  { cityName: 'Muscat', country: 'Oman', timezone: 'Asia/Muscat' },
  { cityName: 'Tehran', country: 'Iran', timezone: 'Asia/Tehran' },
  { cityName: 'Baghdad', country: 'Iraq', timezone: 'Asia/Baghdad' },
  { cityName: 'Beirut', country: 'Lebanon', timezone: 'Asia/Beirut' },
  { cityName: 'Amman', country: 'Jordan', timezone: 'Asia/Amman' },
  { cityName: 'Damascus', country: 'Syria', timezone: 'Asia/Damascus' },
  { cityName: 'Tel Aviv', country: 'Israel', timezone: 'Asia/Jerusalem' },
  { cityName: 'Jerusalem', country: 'Israel', timezone: 'Asia/Jerusalem' },
  { cityName: 'Nicosia', country: 'Cyprus', timezone: 'Asia/Nicosia' },

  // --- ASIA ---
  { cityName: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
  { cityName: 'Osaka', country: 'Japan', timezone: 'Asia/Tokyo' },
  { cityName: 'Kyoto', country: 'Japan', timezone: 'Asia/Tokyo' },
  { cityName: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul' },
  { cityName: 'Beijing', country: 'China', timezone: 'Asia/Shanghai' },
  { cityName: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai' },
  { cityName: 'Hong Kong', country: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
  { cityName: 'Shenzhen', country: 'China', timezone: 'Asia/Shanghai' },
  { cityName: 'Guangzhou', country: 'China', timezone: 'Asia/Shanghai' },
  { cityName: 'Chengdu', country: 'China', timezone: 'Asia/Shanghai' },
  { cityName: 'Taipei', country: 'Taiwan', timezone: 'Asia/Taipei' },
  { cityName: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' },
  { cityName: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok' },
  { cityName: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata' },
  { cityName: 'Delhi', country: 'India', timezone: 'Asia/Kolkata' },
  { cityName: 'Bangalore', country: 'India', timezone: 'Asia/Kolkata' },
  { cityName: 'Kolkata', country: 'India', timezone: 'Asia/Kolkata' },
  { cityName: 'Chennai', country: 'India', timezone: 'Asia/Kolkata' },
  { cityName: 'Kathmandu', country: 'Nepal', timezone: 'Asia/Kathmandu' },
  { cityName: 'Colombo', country: 'Sri Lanka', timezone: 'Asia/Colombo' },
  { cityName: 'Dhaka', country: 'Bangladesh', timezone: 'Asia/Dhaka' },
  { cityName: 'Thimphu', country: 'Bhutan', timezone: 'Asia/Thimphu' },
  { cityName: 'Karachi', country: 'Pakistan', timezone: 'Asia/Karachi' },
  { cityName: 'Lahore', country: 'Pakistan', timezone: 'Asia/Karachi' },
  { cityName: 'Islamabad', country: 'Pakistan', timezone: 'Asia/Karachi' },
  { cityName: 'Jakarta', country: 'Indonesia', timezone: 'Asia/Jakarta' },
  { cityName: 'Manila', country: 'Philippines', timezone: 'Asia/Manila' },
  { cityName: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  { cityName: 'Hanoi', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { cityName: 'Ho Chi Minh City', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { cityName: 'Phnom Penh', country: 'Cambodia', timezone: 'Asia/Phnom_Penh' },
  { cityName: 'Vientiane', country: 'Laos', timezone: 'Asia/Vientiane' },
  { cityName: 'Yangon', country: 'Myanmar', timezone: 'Asia/Yangon' },
  { cityName: 'Ulaanbaatar', country: 'Mongolia', timezone: 'Asia/Ulaanbaatar' },
  { cityName: 'Almaty', country: 'Kazakhstan', timezone: 'Asia/Almaty' },
  { cityName: 'Tashkent', country: 'Uzbekistan', timezone: 'Asia/Tashkent' },
  { cityName: 'Baku', country: 'Azerbaijan', timezone: 'Asia/Baku' },
  { cityName: 'Yerevan', country: 'Armenia', timezone: 'Asia/Yerevan' },
  { cityName: 'Tbilisi', country: 'Georgia', timezone: 'Asia/Tbilisi' },
  { cityName: 'Kabul', country: 'Afghanistan', timezone: 'Asia/Kabul' },
  { cityName: 'Pyongyang', country: 'North Korea', timezone: 'Asia/Pyongyang' },
  { cityName: 'Vladivostok', country: 'Russia', timezone: 'Asia/Vladivostok' },
  { cityName: 'Yakutsk', country: 'Russia', timezone: 'Asia/Yakutsk' },
  { cityName: 'Irkutsk', country: 'Russia', timezone: 'Asia/Irkutsk' },
  { cityName: 'Krasnoyarsk', country: 'Russia', timezone: 'Asia/Krasnoyarsk' },
  { cityName: 'Novosibirsk', country: 'Russia', timezone: 'Asia/Novosibirsk' },
  { cityName: 'Omsk', country: 'Russia', timezone: 'Asia/Omsk' },
  { cityName: 'Yekaterinburg', country: 'Russia', timezone: 'Asia/Yekaterinburg' },
  { cityName: 'Samara', country: 'Russia', timezone: 'Asia/Samara' },
  { cityName: 'Male', country: 'Maldives', timezone: 'Indian/Maldives' },
  { cityName: 'Macau', country: 'Macau', timezone: 'Asia/Macau' },

  // --- OCEANIA ---
  { cityName: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' },
  { cityName: 'Melbourne', country: 'Australia', timezone: 'Australia/Melbourne' },
  { cityName: 'Brisbane', country: 'Australia', timezone: 'Australia/Brisbane' },
  { cityName: 'Perth', country: 'Australia', timezone: 'Australia/Perth' },
  { cityName: 'Adelaide', country: 'Australia', timezone: 'Australia/Adelaide' },
  { cityName: 'Darwin', country: 'Australia', timezone: 'Australia/Darwin' },
  { cityName: 'Hobart', country: 'Australia', timezone: 'Australia/Hobart' },
  { cityName: 'Auckland', country: 'New Zealand', timezone: 'Pacific/Auckland' },
  { cityName: 'Wellington', country: 'New Zealand', timezone: 'Pacific/Auckland' },
  { cityName: 'Fiji', country: 'Fiji', timezone: 'Pacific/Fiji' },
  { cityName: 'Port Moresby', country: 'Papua New Guinea', timezone: 'Pacific/Port_Moresby' },
  { cityName: 'Pago Pago', country: 'American Samoa', timezone: 'Pacific/Pago_Pago' },
  { cityName: 'Noumea', country: 'New Caledonia', timezone: 'Pacific/Noumea' },
  { cityName: 'Apia', country: 'Samoa', timezone: 'Pacific/Apia' },
  { cityName: 'Port Vila', country: 'Vanuatu', timezone: 'Pacific/Efate' },
  { cityName: 'Papeete', country: 'French Polynesia', timezone: 'Pacific/Tahiti' },
  { cityName: 'Honiara', country: 'Solomon Islands', timezone: 'Pacific/Guadalcanal' },
  { cityName: 'Tarawa', country: 'Kiribati', timezone: 'Pacific/Tarawa' },
  { cityName: 'Funafuti', country: 'Tuvalu', timezone: 'Pacific/Funafuti' },
  { cityName: 'Majuro', country: 'Marshall Islands', timezone: 'Pacific/Majuro' },
  { cityName: 'Palikir', country: 'Micronesia', timezone: 'Pacific/Pohnpei' },
  { cityName: 'Koror', country: 'Palau', timezone: 'Pacific/Palau' },
  { cityName: 'Saipan', country: 'Northern Mariana Islands', timezone: 'Pacific/Saipan' },
  { cityName: 'Guam', country: 'Guam', timezone: 'Pacific/Guam' }
];

export const ALL_IANA_TIMEZONES = Array.from(new Set(WORLD_CITIES.map(c => c.timezone))).sort();

export interface DSTInfo {
  hasDST: boolean;
  isDSTNow: boolean;
  abbreviation: string;
  offsetLabel: string;
}

/**
 * Dynamically evaluates the Daylight Saving Time status, standard/daylight abbreviation, 
 * and UTC offset of any standard IANA timezone without requiring network resources.
 */
export function getDSTDetails(timezone: string, date: Date = new Date()): DSTInfo {
  try {
    // 1. Get current dynamic short abbreviation
    const formatterShort = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const partsShort = formatterShort.formatToParts(date);
    const abbreviation = partsShort.find(p => p.type === 'timeZoneName')?.value || 'GMT';

    // 2. Compute DST by comparing January (winter) and July (summer) offsets
    const currentYear = date.getFullYear();
    const jan = new Date(currentYear, 0, 1);
    const jul = new Date(currentYear, 6, 1);

    const formatterJan = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' });
    const formatterJul = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' });

    const janOffsetStr = formatterJan.formatToParts(jan).find(p => p.type === 'timeZoneName')?.value || '';
    const julOffsetStr = formatterJul.formatToParts(jul).find(p => p.type === 'timeZoneName')?.value || '';

    const hasDST = janOffsetStr !== julOffsetStr;

    // Is active now? Compare parsed numeric offsets
    const currentOffsetStr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' })
      .formatToParts(date)
      .find(p => p.type === 'timeZoneName')?.value || 'GMT+00:00';

    const parseOffsetVal = (str: string): number => {
      const match = str.match(/GMT([+-])(\d+):?(\d+)?/);
      if (!match) return 0;
      const sign = match[1] === '+' ? 1 : -1;
      const hours = parseInt(match[2], 10);
      const minutes = match[3] ? parseInt(match[3], 10) : 0;
      return sign * (hours * 60 + minutes);
    };

    const janOffsetMin = parseOffsetVal(janOffsetStr);
    const julOffsetMin = parseOffsetVal(julOffsetStr);
    const currentOffsetMin = parseOffsetVal(currentOffsetStr);

    let isDSTNow = false;
    if (hasDST) {
      // Typically the larger offset is DST
      const maxOffset = Math.max(janOffsetMin, julOffsetMin);
      isDSTNow = currentOffsetMin === maxOffset;
    }

    return {
      hasDST,
      isDSTNow,
      abbreviation,
      offsetLabel: currentOffsetStr,
    };
  } catch (e) {
    return {
      hasDST: false,
      isDSTNow: false,
      abbreviation: 'GMT',
      offsetLabel: 'GMT+00:00',
    };
  }
}
