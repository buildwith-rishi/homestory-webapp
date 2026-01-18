import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Checkbox,
  Radio,
  Toggle,
  Badge,
  Card,
  Avatar,
  Modal,
  Tooltip,
  Progress,
  Skeleton,
} from '../components/ui';
import { Logo, BrandPattern } from '../components/shared';
import {
  Search,
  Heart,
  Settings,
  Home,
  Bell,
  Download,
} from 'lucide-react';

function DesignSystemPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [toggleValue, setToggleValue] = useState(false);

  const selectOptions = [
    { value: 'bangalore', label: 'Bangalore' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'chennai', label: 'Chennai', disabled: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-secondary py-12">
        <BrandPattern color="white" opacity={0.08} animated />
        <div className="relative z-10 container mx-auto px-6">
          <Logo variant="full" colorScheme="light" size={160} animated />
          <h1 className="font-display text-display-xl text-white mt-8">
            Good Homestory Design System
          </h1>
          <p className="font-body text-body-lg text-white/80 mt-4 max-w-2xl">
            A comprehensive UI component library built with Bauhaus-inspired design principles,
            combining structure and flow, curve and containment.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16 space-y-24">
        <section>
          <h2 className="font-display text-display-lg text-secondary mb-2">Branding</h2>
          <p className="font-body text-body text-ash mb-8">
            Logo variations and brand pattern for Good Homestory
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card variant="bordered" padding="lg">
              <h3 className="font-display text-display-sm text-secondary mb-6">Logo Variants</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-8 flex-wrap">
                  <Logo variant="full" size={140} />
                  <Logo variant="mark" size={60} />
                  <Logo variant="type" size={100} />
                </div>
                <div className="bg-secondary p-6 rounded-md">
                  <Logo variant="full" colorScheme="light" size={140} />
                </div>
              </div>
            </Card>
            <Card variant="bordered" padding="lg" className="relative overflow-hidden">
              <BrandPattern opacity={0.1} />
              <h3 className="font-display text-display-sm text-secondary mb-6 relative z-10">
                Brand Pattern
              </h3>
              <p className="font-body text-body text-ash relative z-10">
                Geometric pattern derived from the logomark, used as a subtle background texture
                throughout the application.
              </p>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="font-display text-display-lg text-secondary mb-2">Buttons</h2>
          <p className="font-body text-body text-ash mb-8">
            Primary CTAs, secondary actions, and utility buttons
          </p>
          <div className="space-y-6">
            <Card variant="bordered" padding="lg">
              <h3 className="font-display text-display-sm text-secondary mb-6">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Button</Button>
              </div>
            </Card>
            <Card variant="bordered" padding="lg">
              <h3 className="font-display text-display-sm text-secondary mb-6">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </Card>
            <Card variant="bordered" padding="lg">
              <h3 className="font-display text-display-sm text-secondary mb-6">
                With Icons & States
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button leftIcon={<Download size={16} />}>Download</Button>
                <Button rightIcon={<Heart size={16} />}>Favorite</Button>
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="font-display text-display-lg text-secondary mb-2">Form Elements</h2>
          <p className="font-body text-body text-ash mb-8">
            Inputs, selects, checkboxes, radios, and toggles
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card variant="bordered" padding="lg">
              <h3 className="font-display text-display-sm text-secondary mb-6">Input Fields</h3>
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  placeholder="Enter your email"
                  type="email"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Input
                  label="Search"
                  placeholder="Search projects..."
                  prefixIcon={<Search size={18} />}
                />
                <Input
                  label="With Error"
                  placeholder="Enter value"
                  error="This field is required"
                />
                <Input label="Disabled" placeholder="Disabled input" disabled />
              </div>
            </Card>
            <Card variant="bordered" padding="lg">
              <h3 className="font-display text-display-sm text-secondary mb-6">Select & Options</h3>
              <div className="space-y-6">
                <Select
                  label="Location"
                  options={selectOptions}
                  value={selectValue}
                  onChange={setSelectValue}
                  placeholder="Select a city"
                />
                <div>
                  <label className="block font-body font-medium text-body-sm text-secondary mb-3">
                    Preferences
                  </label>
                  <div className="space-y-3">
                    <Checkbox
                      label="Email notifications"
                      checked={checkboxValue}
                      onChange={(e) => setCheckboxValue(e.target.checked)}
                    />
                    <Toggle
                      label="Enable dark mode"
                      checked={toggleValue}
                      onChange={(e) => setToggleValue(e.target.checked)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-body font-medium text-body-sm text-secondary mb-3">
                    Project Size
                  </label>
                  <div className="space-y-3">
                    <Radio
                      label="15-25 lakhs"
                      name="size"
                      value="option1"
                      checked={radioValue === 'option1'}
                      onChange={(e) => setRadioValue(e.target.value)}
                    />
                    <Radio
                      label="25-35 lakhs"
                      name="size"
                      value="option2"
                      checked={radioValue === 'option2'}
                      onChange={(e) => setRadioValue(e.target.value)}
                    />
                    <Radio
                      label="35-50 lakhs"
                      name="size"
                      value="option3"
                      checked={radioValue === 'option3'}
                      onChange={(e) => setRadioValue(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="font-display text-display-lg text-secondary mb-2">
            Badges & Status Indicators
          </h2>
          <p className="font-body text-body text-ash mb-8">
            Status badges for different states and information
          </p>
          <Card variant="bordered" padding="lg">
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-display-sm text-secondary mb-4">Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="success">Completed</Badge>
                  <Badge variant="warning">Pending</Badge>
                  <Badge variant="error">Failed</Badge>
                  <Badge variant="info">In Progress</Badge>
                  <Badge variant="neutral">Draft</Badge>
                </div>
              </div>
              <div>
                <h3 className="font-display text-display-sm text-secondary mb-4">Sizes</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge size="sm">Small</Badge>
                  <Badge size="md">Medium</Badge>
                  <Badge size="lg">Large</Badge>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <h2 className="font-display text-display-lg text-secondary mb-2">Cards & Containers</h2>
          <p className="font-body text-body text-ash mb-8">
            Content containers with different styles and interactions
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="flat" padding="lg">
              <Home className="text-primary mb-4" size={32} />
              <h3 className="font-display text-display-sm text-secondary mb-2">Flat Card</h3>
              <p className="font-body text-body-sm text-ash">
                Simple card without borders or shadows
              </p>
            </Card>
            <Card variant="bordered" padding="lg">
              <Settings className="text-primary mb-4" size={32} />
              <h3 className="font-display text-display-sm text-secondary mb-2">Bordered Card</h3>
              <p className="font-body text-body-sm text-ash">Card with subtle border outline</p>
            </Card>
            <Card variant="elevated" padding="lg" hoverable>
              <Bell className="text-primary mb-4" size={32} />
              <h3 className="font-display text-display-sm text-secondary mb-2">Elevated Card</h3>
              <p className="font-body text-body-sm text-ash">
                Card with shadow and hover effect
              </p>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="font-display text-display-lg text-secondary mb-2">Avatars & Profiles</h2>
          <p className="font-body text-body text-ash mb-8">User avatars with status indicators</p>
          <Card variant="bordered" padding="lg">
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-display-sm text-secondary mb-4">Sizes</h3>
                <div className="flex flex-wrap items-center gap-6">
                  <Avatar size="sm" initials="SM" />
                  <Avatar size="md" initials="MD" />
                  <Avatar size="lg" initials="LG" />
                  <Avatar size="xl" initials="XL" />
                </div>
              </div>
              <div>
                <h3 className="font-display text-display-sm text-secondary mb-4">
                  With Status Indicators
                </h3>
                <div className="flex flex-wrap items-center gap-6">
                  <Avatar size="md" initials="RK" status="online" />
                  <Avatar size="md" initials="AS" status="busy" />
                  <Avatar size="md" initials="PM" status="away" />
                  <Avatar size="md" initials="JD" status="offline" />
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <h2 className="font-display text-display-lg text-secondary mb-2">
            Interactive Elements
          </h2>
          <p className="font-body text-body text-ash mb-8">Modals, tooltips, and progress bars</p>
          <div className="space-y-8">
            <Card variant="bordered" padding="lg">
              <h3 className="font-display text-display-sm text-secondary mb-6">Modal</h3>
              <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Welcome to Good Homestory"
                size="md"
                footer={
                  <>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsModalOpen(false)}>Get Started</Button>
                  </>
                }
              >
                <p className="font-body text-body text-secondary">
                  Transform your home with Bangalore's fastest-growing interior design company.
                  We specialize in projects ranging from ₹15 lakhs to ₹50 lakhs, delivering
                  exceptional quality for middle-class families.
                </p>
              </Modal>
            </Card>
            <Card variant="bordered" padding="lg">
              <h3 className="font-display text-display-sm text-secondary mb-6">Tooltips</h3>
              <div className="flex flex-wrap gap-4">
                <Tooltip content="This is a top tooltip" position="top">
                  <Button variant="secondary" size="sm">
                    Top
                  </Button>
                </Tooltip>
                <Tooltip content="This is a right tooltip" position="right">
                  <Button variant="secondary" size="sm">
                    Right
                  </Button>
                </Tooltip>
                <Tooltip content="This is a bottom tooltip" position="bottom">
                  <Button variant="secondary" size="sm">
                    Bottom
                  </Button>
                </Tooltip>
                <Tooltip content="This is a left tooltip" position="left">
                  <Button variant="secondary" size="sm">
                    Left
                  </Button>
                </Tooltip>
              </div>
            </Card>
            <Card variant="bordered" padding="lg">
              <h3 className="font-display text-display-sm text-secondary mb-6">Progress Bars</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-body text-body-sm text-secondary">Project Progress</span>
                    <span className="font-body text-body-sm text-ash">75%</span>
                  </div>
                  <Progress value={75} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-body text-body-sm text-secondary">Upload Status</span>
                    <span className="font-body text-body-sm text-ash">45%</span>
                  </div>
                  <Progress value={45} variant="gradient" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-body text-body-sm text-secondary">Budget Used</span>
                    <span className="font-body text-body-sm text-ash">90%</span>
                  </div>
                  <Progress value={90} showLabel />
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="font-display text-display-lg text-secondary mb-2">Loading States</h2>
          <p className="font-body text-body text-ash mb-8">Skeleton loaders for content</p>
          <Card variant="bordered" padding="lg">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton variant="circle" width={48} height={48} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </div>
              </div>
              <Skeleton variant="rectangle" height={200} />
              <div className="space-y-2">
                <Skeleton variant="text" />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" width="70%" />
              </div>
            </div>
          </Card>
        </section>

        <section className="pb-16">
          <h2 className="font-display text-display-lg text-secondary mb-2">Typography Scale</h2>
          <p className="font-body text-body text-ash mb-8">
            Display and body text hierarchy using brand fonts
          </p>
          <Card variant="bordered" padding="lg">
            <div className="space-y-6">
              <div>
                <p className="font-body text-caption text-ash mb-2">Display XL / 48px</p>
                <h1 className="font-display text-display-xl text-secondary">
                  Transform Your Space
                </h1>
              </div>
              <div>
                <p className="font-body text-caption text-ash mb-2">Display LG / 36px</p>
                <h2 className="font-display text-display-lg text-secondary">
                  Interior Design Excellence
                </h2>
              </div>
              <div>
                <p className="font-body text-caption text-ash mb-2">Display MD / 28px</p>
                <h3 className="font-display text-display-md text-secondary">
                  Serving Middle-Class Families
                </h3>
              </div>
              <div>
                <p className="font-body text-caption text-ash mb-2">Body LG / 18px</p>
                <p className="font-body text-body-lg text-secondary">
                  We create beautiful, functional spaces that reflect your personality and enhance
                  your lifestyle.
                </p>
              </div>
              <div>
                <p className="font-body text-caption text-ash mb-2">Body / 16px</p>
                <p className="font-body text-body text-secondary">
                  Projects ranging from ₹15 lakhs to ₹50 lakhs with exceptional attention to
                  detail.
                </p>
              </div>
              <div>
                <p className="font-body text-caption text-ash mb-2">Body SM / 14px</p>
                <p className="font-body text-body-sm text-ash">
                  Combining structure and flow, curve and containment in every design.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>

      <footer className="relative bg-secondary py-12">
        <BrandPattern color="white" opacity={0.05} />
        <div className="relative z-10 container mx-auto px-6 text-center">
          <Logo variant="full" colorScheme="light" size={140} className="mx-auto mb-6" />
          <p className="font-body text-body text-white/60">
            Good Homestory Design System — Built with precision and care
          </p>
        </div>
      </footer>
    </div>
  );
}

export default DesignSystemPage;
