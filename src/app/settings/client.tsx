
'use client';

import { useActionState, useEffect } from 'react';
import { handleUpdateSettings } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Lightbulb, Loader2 } from 'lucide-react';
import type { UserSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Separator } from '@/components/ui/separator';

function SubmitButton() {
  const { pending } = useActionState(handleUpdateSettings, null) as any;
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save
    </Button>
  );
}

export default function SettingsClient({ initialSettings }: { initialSettings: UserSettings }) {
  const [state, formAction] = useActionState(handleUpdateSettings, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success === true) {
      toast({
        title: 'Success',
        description: state.message,
      });
    } else if (state?.success === false && state.message) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSwitcher />
          </CardContent>
      </Card>
      
      <Card className="max-w-2xl">
        <form action={formAction}>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your personal information and localization settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                <Input id="name" name="name" defaultValue={initialSettings.name} />
                {state?.errors?.name && <p className="text-sm font-medium text-destructive">{state.errors.name[0]}</p>}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>Must be between 1 and 250 characters long.</span>
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="language">Language <span className="text-destructive">*</span></Label>
                <Select name="language" defaultValue={initialSettings.language}>
                    <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lightbulb className="h-4 w-4" />
                    <span>Sets environment language.</span>
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="locale">Locale <span className="text-destructive">*</span></Label>
                <Select name="locale" defaultValue={initialSettings.locale}>
                    <SelectTrigger id="locale">
                        <SelectValue placeholder="Select locale" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en-us">English (United States)</SelectItem>
                        <SelectItem value="en-gb">English (United Kingdom)</SelectItem>
                        <SelectItem value="es-es">Español (España)</SelectItem>
                        <SelectItem value="fr-fr">Français (France)</SelectItem>
                        <SelectItem value="de-de">Deutsch (Deutschland)</SelectItem>
                    </SelectContent>
                </Select>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lightbulb className="h-4 w-4" />
                    <span>Sets environment date formats, hour formats, decimal separators etc.</span>
                </div>
              </div>
                <div className="space-y-2">
                <Label htmlFor="timezone">Timezone <span className="text-destructive">*</span></Label>
                <Select name="timezone" defaultValue={initialSettings.timezone}>
                    <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gmt-12">(GMT-12:00) International Date Line West</SelectItem>
                        <SelectItem value="gmt-11">(GMT-11:00) Midway Island, Samoa</SelectItem>
                        <SelectItem value="gmt-10">(GMT-10:00) Hawaii</SelectItem>
                        <SelectItem value="gmt-9">(GMT-09:00) Alaska</SelectItem>
                        <SelectItem value="gmt-8">(GMT-08:00) Pacific Time (US & Canada)</SelectItem>
                        <SelectItem value="gmt-7">(GMT-07:00) Mountain Time (US & Canada)</SelectItem>
                        <SelectItem value="gmt-6">(GMT-06:00) Central Time (US & Canada), Mexico City</SelectItem>
                        <SelectItem value="gmt-5">(GMT-05:00) Eastern Time (US & Canada), Bogota, Lima</SelectItem>
                        <SelectItem value="gmt-4">(GMT-04:00) Atlantic Time (Canada), Caracas, La Paz</SelectItem>
                        <SelectItem value="gmt-3.5">(GMT-03:30) Newfoundland</SelectItem>
                        <SelectItem value="gmt-3">(GMT-03:00) Brazil, Buenos Aires, Georgetown</SelectItem>
                        <SelectItem value="gmt-2">(GMT-02:00) Mid-Atlantic</SelectItem>
                        <SelectItem value="gmt-1">(GMT-01:00) Azores, Cape Verde Islands</SelectItem>
                        <SelectItem value="gmt+0">(GMT+00:00) Western Europe Time, London, Lisbon, Casablanca</SelectItem>
                        <SelectItem value="gmt+1">(GMT+01:00) Brussels, Copenhagen, Madrid, Paris</SelectItem>
                        <SelectItem value="gmt+2">(GMT+02:00) Kaliningrad, Cairo</SelectItem>
                        <SelectItem value="gmt+3">(GMT+03:00) Baghdad, Riyadh, Moscow, St. Petersburg</SelectItem>
                        <SelectItem value="gmt+3.5">(GMT+03:30) Tehran</SelectItem>
                        <SelectItem value="gmt+4">(GMT+04:00) Abu Dhabi, Muscat, Baku, Tbilisi</SelectItem>
                        <SelectItem value="gmt+4.5">(GMT+04:30) Kabul</SelectItem>
                        <SelectItem value="gmt+5">(GMT+05:00) Yekaterinburg, Islamabad, Karachi, Tashkent</SelectItem>
                        <SelectItem value="gmt+5.5">(GMT+05:30) Mumbai, Kolkata, Chennai, New Delhi</SelectItem>
                        <SelectItem value="gmt+5.75">(GMT+05:45) Kathmandu</SelectItem>
                        <SelectItem value="gmt+6">(GMT+06:00) Almaty, Dhaka, Colombo</SelectItem>
                        <SelectItem value="gmt+7">(GMT+07:00) Bangkok, Hanoi, Jakarta</SelectItem>
                        <SelectItem value="gmt+8">(GMT+08:00) Beijing, Perth, Singapore, Hong Kong</SelectItem>
                        <SelectItem value="gmt+9">(GMT+09:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk</SelectItem>
                        <SelectItem value="gmt+9.5">(GMT+09:30) Adelaide, Darwin</SelectItem>
                        <SelectItem value="gmt+10">(GMT+10:00) Eastern Australia, Guam, Vladivostok</SelectItem>
                        <SelectItem value="gmt+11">(GMT+11:00) Magadan, Solomon Islands, New Caledonia</SelectItem>
                        <SelectItem value="gmt+12">(GMT+12:00) Auckland, Wellington, Fiji, Kamchatka</SelectItem>
                    </SelectContent>
                </Select>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lightbulb className="h-4 w-4" />
                    <span>Sets environment time zone with corresponding local time.</span>
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                <Select name="country" defaultValue={initialSettings.country}>
                    <SelectTrigger id="country">
                        <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="USA">United States of America (USA)</SelectItem>
                        <SelectItem value="AFG">Afghanistan</SelectItem>
                        <SelectItem value="ALA">Åland Islands</SelectItem>
                        <SelectItem value="ALB">Albania</SelectItem>
                        <SelectItem value="DZA">Algeria</SelectItem>
                        <SelectItem value="ASM">American Samoa</SelectItem>
                        <SelectItem value="AND">Andorra</SelectItem>
                        <SelectItem value="AGO">Angola</SelectItem>
                        <SelectItem value="AIA">Anguilla</SelectItem>
                        <SelectItem value="ATA">Antarctica</SelectItem>
                        <SelectItem value="ATG">Antigua and Barbuda</SelectItem>
                        <SelectItem value="ARG">Argentina</SelectItem>
                        <SelectItem value="ARM">Armenia</SelectItem>
                        <SelectItem value="ABW">Aruba</SelectItem>
                        <SelectItem value="AUS">Australia</SelectItem>
                        <SelectItem value="AUT">Austria</SelectItem>
                        <SelectItem value="AZE">Azerbaijan</SelectItem>
                        <SelectItem value="BHS">Bahamas</SelectItem>
                        <SelectItem value="BHR">Bahrain</SelectItem>
                        <SelectItem value="BGD">Bangladesh</SelectItem>
                        <SelectItem value="BRB">Barbados</SelectItem>
                        <SelectItem value="BLR">Belarus</SelectItem>
                        <SelectItem value="BEL">Belgium</SelectItem>
                        <SelectItem value="BLZ">Belize</SelectItem>
                        <SelectItem value="BEN">Benin</SelectItem>
                        <SelectItem value="BMU">Bermuda</SelectItem>
                        <SelectItem value="BTN">Bhutan</SelectItem>
                        <SelectItem value="BOL">Bolivia</SelectItem>
                        <SelectItem value="BES">Bonaire, Sint Eustatius and Saba</SelectItem>
                        <SelectItem value="BIH">Bosnia and Herzegovina</SelectItem>
                        <SelectItem value="BWA">Botswana</SelectItem>
                        <SelectItem value="BVT">Bouvet Island</SelectItem>
                        <SelectItem value="BRA">Brazil</SelectItem>
                        <SelectItem value="IOT">British Indian Ocean Territory</SelectItem>
                        <SelectItem value="BRN">Brunei Darussalam</SelectItem>
                        <SelectItem value="BGR">Bulgaria</SelectItem>
                        <SelectItem value="BFA">Burkina Faso</SelectItem>
                        <SelectItem value="BDI">Burundi</SelectItem>
                        <SelectItem value="KHM">Cambodia</SelectItem>
                        <SelectItem value="CMR">Cameroon</SelectItem>
                        <SelectItem value="CAN">Canada</SelectItem>
                        <SelectItem value="CPV">Cape Verde</SelectItem>
                        <SelectItem value="CYM">Cayman Islands</SelectItem>
                        <SelectItem value="CAF">Central African Republic</SelectItem>
                        <SelectItem value="TCD">Chad</SelectItem>
                        <SelectItem value="CHL">Chile</SelectItem>
                        <SelectItem value="CHN">China</SelectItem>
                        <SelectItem value="CXR">Christmas Island</SelectItem>
                        <SelectItem value="CCK">Cocos (Keeling) Islands</SelectItem>
                        <SelectItem value="COL">Colombia</SelectItem>
                        <SelectItem value="COM">Comoros</SelectItem>
                        <SelectItem value="COG">Congo</SelectItem>
                        <SelectItem value="COD">Congo, the Democratic Republic of the</SelectItem>
                        <SelectItem value="COK">Cook Islands</SelectItem>
                        <SelectItem value="CRI">Costa Rica</SelectItem>
                        <SelectItem value="CIV">Côte d'Ivoire</SelectItem>
                        <SelectItem value="HRV">Croatia</SelectItem>
                        <SelectItem value="CUB">Cuba</SelectItem>
                        <SelectItem value="CUW">Curaçao</SelectItem>
                        <SelectItem value="CYP">Cyprus</SelectItem>
                        <SelectItem value="CZE">Czech Republic</SelectItem>
                        <SelectItem value="DNK">Denmark</SelectItem>
                        <SelectItem value="DJI">Djibouti</SelectItem>
                        <SelectItem value="DMA">Dominica</SelectItem>
                        <SelectItem value="DOM">Dominican Republic</SelectItem>
                        <SelectItem value="ECU">Ecuador</SelectItem>
                        <SelectItem value="EGY">Egypt</SelectItem>
                        <SelectItem value="SLV">El Salvador</SelectItem>
                        <SelectItem value="GNQ">Equatorial Guinea</SelectItem>
                        <SelectItem value="ERI">Eritrea</SelectItem>
                        <SelectItem value="EST">Estonia</SelectItem>
                        <SelectItem value="ETH">Ethiopia</SelectItem>
                        <SelectItem value="FLK">Falkland Islands (Malvinas)</SelectItem>
                        <SelectItem value="FRO">Faroe Islands</SelectItem>
                        <SelectItem value="FJI">Fiji</SelectItem>
                        <SelectItem value="FIN">Finland</SelectItem>
                        <SelectItem value="FRA">France</SelectItem>
                        <SelectItem value="GUF">French Guiana</SelectItem>
                        <SelectItem value="PYF">French Polynesia</SelectItem>
                        <SelectItem value="ATF">French Southern Territories</SelectItem>
                        <SelectItem value="GAB">Gabon</SelectItem>
                        <SelectItem value="GMB">Gambia</SelectItem>
                        <SelectItem value="GEO">Georgia</SelectItem>
                        <SelectItem value="DEU">Germany</SelectItem>
                        <SelectItem value="GHA">Ghana</SelectItem>
                        <SelectItem value="GIB">Gibraltar</SelectItem>
                        <SelectItem value="GRC">Greece</SelectItem>
                        <SelectItem value="GRL">Greenland</SelectItem>
                        <SelectItem value="GRD">Grenada</SelectItem>
                        <SelectItem value="GLP">Guadeloupe</SelectItem>
                        <SelectItem value="GUM">Guam</SelectItem>
                        <SelectItem value="GTM">Guatemala</SelectItem>
                        <SelectItem value="GGY">Guernsey</SelectItem>
                        <SelectItem value="GIN">Guinea</SelectItem>
                        <SelectItem value="GNB">Guinea-Bissau</SelectItem>
                        <SelectItem value="GUY">Guyana</SelectItem>
                        <SelectItem value="HTI">Haiti</SelectItem>
                        <SelectItem value="HMD">Heard Island and McDonald Islands</SelectItem>
                        <SelectItem value="VAT">Holy See (Vatican City State)</SelectItem>
                        <SelectItem value="HND">Honduras</SelectItem>
                        <SelectItem value="HKG">Hong Kong</SelectItem>
                        <SelectItem value="HUN">Hungary</SelectItem>
                        <SelectItem value="ISL">Iceland</SelectItem>
                        <SelectItem value="IND">India</SelectItem>
                        <SelectItem value="IDN">Indonesia</SelectItem>
                        <SelectItem value="IRN">Iran, Islamic Republic of</SelectItem>
                        <SelectItem value="IRQ">Iraq</SelectItem>
                        <SelectItem value="IRL">Ireland</SelectItem>
                        <SelectItem value="IMN">Isle of Man</SelectItem>
                        <SelectItem value="ISR">Israel</SelectItem>
                        <SelectItem value="ITA">Italy</SelectItem>
                        <SelectItem value="JAM">Jamaica</SelectItem>
                        <SelectItem value="JPN">Japan</SelectItem>
                        <SelectItem value="JEY">Jersey</SelectItem>
                        <SelectItem value="JOR">Jordan</SelectItem>
                        <SelectItem value="KAZ">Kazakhstan</SelectItem>
                        <SelectItem value="KEN">Kenya</SelectItem>
                        <SelectItem value="KIR">Kiribati</SelectItem>
                        <SelectItem value="PRK">Korea, Democratic People's Republic of</SelectItem>
                        <SelectItem value="KOR">Korea, Republic of</SelectItem>
                        <SelectItem value="KWT">Kuwait</SelectItem>
                        <SelectItem value="KGZ">Kyrgyzstan</SelectItem>
                        <SelectItem value="LAO">Lao People's Democratic Republic</SelectItem>
                        <SelectItem value="LVA">Latvia</SelectItem>
                        <SelectItem value="LBN">Lebanon</SelectItem>
                        <SelectItem value="LSO">Lesotho</SelectItem>
                        <SelectItem value="LBR">Liberia</SelectItem>
                        <SelectItem value="LBY">Libya</SelectItem>
                        <SelectItem value="LIE">Liechtenstein</SelectItem>
                        <SelectItem value="LTU">Lithuania</SelectItem>
                        <SelectItem value="LUX">Luxembourg</SelectItem>
                        <SelectItem value="MAC">Macao</SelectItem>
                        <SelectItem value="MKD">Macedonia, the former Yugoslav Republic of</SelectItem>
                        <SelectItem value="MDG">Madagascar</SelectItem>
                        <SelectItem value="MWI">Malawi</SelectItem>
                        <SelectItem value="MYS">Malaysia</SelectItem>
                        <SelectItem value="MDV">Maldives</SelectItem>
                        <SelectItem value="MLI">Mali</SelectItem>
                        <SelectItem value="MLT">Malta</SelectItem>
                        <SelectItem value="MHL">Marshall Islands</SelectItem>
                        <SelectItem value="MTQ">Martinique</SelectItem>
                        <SelectItem value="MRT">Mauritania</SelectItem>
                        <SelectItem value="MUS">Mauritius</SelectItem>
                        <SelectItem value="MYT">Mayotte</SelectItem>
                        <SelectItem value="MEX">Mexico</SelectItem>
                        <SelectItem value="FSM">Micronesia, Federated States of</SelectItem>
                        <SelectItem value="MDA">Moldova, Republic of</SelectItem>
                        <SelectItem value="MCO">Monaco</SelectItem>
                        <SelectItem value="MNG">Mongolia</SelectItem>
                        <SelectItem value="MNE">Montenegro</SelectItem>
                        <SelectItem value="MSR">Montserrat</SelectItem>
                        <SelectItem value="MAR">Morocco</SelectItem>
                        <SelectItem value="MOZ">Mozambique</SelectItem>
                        <SelectItem value="MMR">Myanmar</SelectItem>
                        <SelectItem value="NAM">Namibia</SelectItem>
                        <SelectItem value="NRU">Nauru</SelectItem>
                        <SelectItem value="NPL">Nepal</SelectItem>
                        <SelectItem value="NLD">Netherlands</SelectItem>
                        <SelectItem value="NCL">New Caledonia</SelectItem>
                        <SelectItem value="NZL">New Zealand</SelectItem>
                        <SelectItem value="NIC">Nicaragua</SelectItem>
                        <SelectItem value="NER">Niger</SelectItem>
                        <SelectItem value="NGA">Nigeria</SelectItem>
                        <SelectItem value="NIU">Niue</SelectItem>
                        <SelectItem value="NFK">Norfolk Island</SelectItem>
                        <SelectItem value="MNP">Northern Mariana Islands</SelectItem>
                        <SelectItem value="NOR">Norway</SelectItem>
                        <SelectItem value="OMN">Oman</SelectItem>
                        <SelectItem value="PAK">Pakistan</SelectItem>
                        <SelectItem value="PLW">Palau</SelectItem>
                        <SelectItem value="PSE">Palestinian Territory, Occupied</SelectItem>
                        <SelectItem value="PAN">Panama</SelectItem>
                        <SelectItem value="PNG">Papua New Guinea</SelectItem>
                        <SelectItem value="PRY">Paraguay</SelectItem>
                        <SelectItem value="PER">Peru</SelectItem>
                        <SelectItem value="PHL">Philippines</SelectItem>
                        <SelectItem value="PCN">Pitcairn</SelectItem>
                        <SelectItem value="POL">Poland</SelectItem>
                        <SelectItem value="PRT">Portugal</SelectItem>
                        <SelectItem value="PRI">Puerto Rico</SelectItem>
                        <SelectItem value="QAT">Qatar</SelectItem>
                        <SelectItem value="REU">Réunion</SelectItem>
                        <SelectItem value="ROU">Romania</SelectItem>
                        <SelectItem value="RUS">Russian Federation</SelectItem>
                        <SelectItem value="RWA">Rwanda</SelectItem>
                        <SelectItem value="BLM">Saint Barthélemy</SelectItem>
                        <SelectItem value="SHN">Saint Helena, Ascension and Tristan da Cunha</SelectItem>
                        <SelectItem value="KNA">Saint Kitts and Nevis</SelectItem>
                        <SelectItem value="LCA">Saint Lucia</SelectItem>
                        <SelectItem value="MAF">Saint Martin (French part)</SelectItem>
                        <SelectItem value="SPM">Saint Pierre and Miquelon</SelectItem>
                        <SelectItem value="VCT">Saint Vincent and the Grenadines</SelectItem>
                        <SelectItem value="WSM">Samoa</SelectItem>
                        <SelectItem value="SMR">San Marino</SelectItem>
                        <SelectItem value="STP">Sao Tome and Principe</SelectItem>
                        <SelectItem value="SAU">Saudi Arabia</SelectItem>
                        <SelectItem value="SEN">Senegal</SelectItem>
                        <SelectItem value="SRB">Serbia</SelectItem>
                        <SelectItem value="SYC">Seychelles</SelectItem>
                        <SelectItem value="SLE">Sierra Leone</SelectItem>
                        <SelectItem value="SGP">Singapore</SelectItem>
                        <SelectItem value="SXM">Sint Maarten (Dutch part)</SelectItem>
                        <SelectItem value="SVK">Slovakia</SelectItem>
                        <SelectItem value="SVN">Slovenia</SelectItem>
                        <SelectItem value="SLB">Solomon Islands</SelectItem>
                        <SelectItem value="SOM">Somalia</SelectItem>
                        <SelectItem value="ZAF">South Africa</SelectItem>
                        <SelectItem value="SGS">South Georgia and the South Sandwich Islands</SelectItem>
                        <SelectItem value="SSD">South Sudan</SelectItem>
                        <SelectItem value="ESP">Spain</SelectItem>
                        <SelectItem value="LKA">Sri Lanka</SelectItem>
                        <SelectItem value="SDN">Sudan</SelectItem>
                        <SelectItem value="SUR">Suriname</SelectItem>
                        <SelectItem value="SJM">Svalbard and Jan Mayen</SelectItem>
                        <SelectItem value="SWZ">Swaziland</SelectItem>
                        <SelectItem value="SWE">Sweden</SelectItem>
                        <SelectItem value="CHE">Switzerland</SelectItem>
                        <SelectItem value="SYR">Syrian Arab Republic</SelectItem>
                        <SelectItem value="TWN">Taiwan, Province of China</SelectItem>
                        <SelectItem value="TJK">Tajikistan</SelectItem>
                        <SelectItem value="TZA">Tanzania, United Republic of</SelectItem>
                        <SelectItem value="THA">Thailand</SelectItem>
                        <SelectItem value="TLS">Timor-Leste</SelectItem>
                        <SelectItem value="TGO">Togo</SelectItem>
                        <SelectItem value="TKL">Tokelau</SelectItem>
                        <SelectItem value="TON">Tonga</SelectItem>
                        <SelectItem value="TTO">Trinidad and Tobago</SelectItem>
                        <SelectItem value="TUN">Tunisia</SelectItem>
                        <SelectItem value="TUR">Turkey</SelectItem>
                        <SelectItem value="TKM">Turkmenistan</SelectItem>
                        <SelectItem value="TCA">Turks and Caicos Islands</SelectItem>
                        <SelectItem value="TUV">Tuvalu</SelectItem>
                        <SelectItem value="UGA">Uganda</SelectItem>
                        <SelectItem value="UKR">Ukraine</SelectItem>
                        <SelectItem value="ARE">United Arab Emirates</SelectItem>
                        <SelectItem value="GBR">United Kingdom</SelectItem>
                        <SelectItem value="UMI">United States Minor Outlying Islands</SelectItem>
                        <SelectItem value="URY">Uruguay</SelectItem>
                        <SelectItem value="UZB">Uzbekistan</SelectItem>
                        <SelectItem value="VUT">Vanuatu</SelectItem>
                        <SelectItem value="VEN">Venezuela, Bolivarian Republic of</SelectItem>
                        <SelectItem value="VNM">Viet Nam</SelectItem>
                        <SelectItem value="VGB">Virgin Islands, British</SelectItem>
                        <SelectItem value="VIR">Virgin Islands, U.S.</SelectItem>
                        <SelectItem value="WLF">Wallis and Futuna</SelectItem>
                        <SelectItem value="ESH">Western Sahara</SelectItem>
                        <SelectItem value="YEM">Yemen</SelectItem>
                        <SelectItem value="ZMB">Zambia</SelectItem>
                        <SelectItem value="ZWE">Zimbabwe</SelectItem>
                    </SelectContent>
                </Select>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lightbulb className="h-4 w-4" />
                    <span>Sets region of use.</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end space-x-2">
            <Button variant="ghost">Close</Button>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
